import { DomainError } from "@/shared/errors";
import { isValidCpf } from "@/shared/cpf";
import type { CanonicalCardToken } from "@/shared/infra/simpay";
import { startPaymentAttempt, recoverPaymentAttempt, recordAttemptResponse } from "./payment-attempts";
import { PaymentProviderError, paymentProviderErrorDescription } from "@/shared/infra/paymentProviderError";
import { isApprovedSimpayStatus, isFailedSimpayStatus, type SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CardPaymentReturn, CreateCardPaymentBody } from "../dtos";
import { PaymentErrors } from "../errors";
import { ConfirmPayment } from "./ConfirmPayment";
import { buildPaymentDescription, resolvePayingCustomer } from "./resolvePayingCustomer";

export class CreateCardPayment {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly simpay: SimpayClient,
	) {}

	async execute(userId: string, data: CreateCardPaymentBody): Promise<CardPaymentReturn> {
		const context = await resolvePayingCustomer(
			this.prisma,
			userId,
			{ cpf: data.holderCpf ?? data.cpf, orderId: data.orderId, slug: data.slug },
		);
		const { customer, merchant, order, user } = context;

		const existingPayment = await this.prisma.payment.findUnique({ where: { orderId: order.id } });
		if (existingPayment?.status === "confirmed") throw new DomainError(PaymentErrors.PAYMENT_ALREADY_CONFIRMED);
		const { attempt, created } = await startPaymentAttempt(this.prisma, context, "credit_card");
		if (!created) {
			const recovered = await recoverPaymentAttempt(this.prisma, this.simpay, context, attempt.id);
			return { status: recovered.status, token: recovered.payment.token };
		}
		if (data.replaceSavedCardId && (!data.card || !data.saveCard || !await this.prisma.savedCard.findFirst({ where: { id: data.replaceSavedCardId, customerId: customer.id } }))) {
			await this.prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { state: "failed" } });
			throw new DomainError(PaymentErrors.SAVED_CARD_NOT_FOUND);
		}
		let bin = "";
		let cardToken: string;
		let brand = "unknown";
		let holderName = user.name;
		let holderDocument = (data.holderCpf ?? data.cpf)?.replace(/\D/g, "") ?? null;
		let tokenizedForSave: CanonicalCardToken | null = null;
		let savedCardToBackfillId: string | null = null;

		try {
		if (data.savedCardId) {
			const savedCard = await this.prisma.savedCard.findFirst({
				where: { customerId: customer.id, id: data.savedCardId },
			});
			if (!savedCard) throw new DomainError(PaymentErrors.SAVED_CARD_NOT_FOUND);

			if (!savedCard.bin || !/^\d{6,8}$/.test(savedCard.bin)) throw new DomainError(PaymentErrors.SAVED_CARD_REAUTH_REQUIRED);
			bin = savedCard.bin;
			cardToken = savedCard.cardToken;
			brand = savedCard.brand;
			holderName = savedCard.holderName;
			holderDocument = savedCard.holderDocument ?? holderDocument;
			if (!savedCard.holderDocument) savedCardToBackfillId = savedCard.id;
		} else if (data.card) {
			if (!holderDocument) throw new DomainError(PaymentErrors.DOCUMENT_REQUIRED);
			let tokenized: CanonicalCardToken;
			try {
				const domId = await this.createCustomer(context, holderDocument);
				tokenized = await this.simpay.tokenizeCard(merchant!, domId, {
					cvv: data.card.cvv,
					expMonth: data.card.expMonth,
					expYear: data.card.expYear,
					holderDocument,
					holderName: data.card.holderName,
					number: data.card.number.replace(/\D/g, ""),
				});
			} catch (error) {
				if (error instanceof PaymentProviderError) {
					throw new DomainError(PaymentErrors.CARD_TOKENIZATION_FAILED, error.message);
				}
				throw error;
			}

			bin = tokenized.bin;
			cardToken = tokenized.token;
			brand = tokenized.brand;
			holderName = tokenized.holderName;
			if (data.saveCard) tokenizedForSave = tokenized;
		} else {
			throw new DomainError(PaymentErrors.CARD_REQUIRED);
		}
		if (!holderDocument) throw new DomainError(PaymentErrors.DOCUMENT_REQUIRED);
		if (!isValidCpf(holderDocument)) throw new DomainError(PaymentErrors.INVALID_DOCUMENT);

		} catch (error) {
			await this.prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { state: "failed" } });
			throw error;
		}
		const existing = await this.prisma.payment.findUnique({ where: { orderId: order.id } });
		if (existing?.status === "confirmed") throw new DomainError(PaymentErrors.PAYMENT_ALREADY_CONFIRMED);

		const phone = (customer.phone ?? user.phoneNumber ?? "").replace(/\D/g, "");

		await this.prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { state: "submitting" } });
		let simpayPaymentId: string | null = null;
		let gatewayStatus = "";
		try {
			const result = await this.simpay.createCardPayment({
				idempotencyKey: attempt.id,
				bin,
				brand,
				allocation: { merchantAmountCents: order.total - order.feeTotalCents, platformFeeCents: order.feeTotalCents },
				description: buildPaymentDescription(order),
				document: holderDocument,
				document_type: holderDocument.length === 11 ? "CPF" : "CNPJ",
				email: user.email,
				holder_name: holderName,
				installments: 1,
				mobile_phone: phone || undefined,
				name: user.name,
				price: order.total / 100,
				token: cardToken,
			}, merchant);
			await recordAttemptResponse(this.prisma, attempt.id, result);
			simpayPaymentId = result.paymentId ?? result.id ?? null;
			gatewayStatus = result.status;
		} catch (error) {
			if (error instanceof PaymentProviderError && [400, 422].includes(error.status ?? 0)) {
				await this.prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { state: "failed" } });
				throw new DomainError(PaymentErrors.CARD_DECLINED, paymentProviderErrorDescription(error));
			}
			throw new DomainError(PaymentErrors.PAYMENT_PROCESSING, paymentProviderErrorDescription(error));
		}
		if (isFailedSimpayStatus(gatewayStatus)) {
			throw new DomainError(PaymentErrors.CARD_DECLINED);
		}

		if (tokenizedForSave) {
			const existingCards = await this.prisma.savedCard.count({ where: { customerId: customer.id } });
			const savedData = {
					bin: tokenizedForSave.bin,
					brand: tokenizedForSave.brand,
					cardToken: tokenizedForSave.token,
					customerId: customer.id,
					expiryMonth: tokenizedForSave.expiryMonth,
					expiryYear: tokenizedForSave.expiryYear,
					holderDocument,
					holderName: tokenizedForSave.holderName,
					isDefault: existingCards === 0,
					last4: tokenizedForSave.last4,
					nickname: data.cardNickname?.trim() || null,
			};
			if (data.replaceSavedCardId) {
				const previous = await this.prisma.savedCard.findFirst({ where: { id: data.replaceSavedCardId, customerId: customer.id } });
				if (!previous) throw new DomainError(PaymentErrors.SAVED_CARD_NOT_FOUND);
				await this.prisma.savedCard.update({ where: { id: previous.id }, data: { ...savedData, isDefault: previous.isDefault } });
			} else await this.prisma.savedCard.create({ data: savedData });
		}
		if (savedCardToBackfillId) {
			await this.prisma.savedCard.update({
				data: { holderDocument },
				where: { id: savedCardToBackfillId },
			});
		}

		const payment = existing
			? await this.prisma.payment.update({
					data: {
						amount: order.total,
						method: "credit_card",
						pixContent: null,
						pixQrcode: null,
						simpayPaymentId,
						status: "pending",
					},
					where: { id: existing.id },
				})
			: await this.prisma.payment.create({
					data: { amount: order.total, method: "credit_card", orderId: order.id, simpayPaymentId },
				});

		// Simintpay accepts the request before the acquirer settles it. HTTP success and
		// PENDING must not release the order; only an explicit approval may do that.
		if (isApprovedSimpayStatus(gatewayStatus)) {
			await new ConfirmPayment(this.prisma).execute(payment.token);
			await this.prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { state: "confirmed" } });
			return { status: "confirmed", token: payment.token };
		}

		return { status: "pending", token: payment.token };
	}

	private async createCustomer(context: Awaited<ReturnType<typeof resolvePayingCustomer>>, document: string) {
		if (!context.merchant) throw new DomainError(PaymentErrors.CARD_TOKENIZATION_FAILED);
		const { id } = await this.simpay.createCustomer(context.merchant, { externalCustomerId: context.customer.id, name: context.user.name, email: context.user.email, document, phone: (context.customer.phone ?? context.user.phoneNumber ?? "").replace(/\D/g, "") || undefined });
		return id;
	}
}
