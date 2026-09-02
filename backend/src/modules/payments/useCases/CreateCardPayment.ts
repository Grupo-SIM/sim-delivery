import { DomainError } from "@/shared/errors";
import { isValidCpf } from "@/shared/cpf";
import type { DomCardTokenResult, DomPagamentosClient } from "@/shared/infra/domPagamentos";
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
		private readonly dom: DomPagamentosClient,
	) {}

	async execute(userId: string, data: CreateCardPaymentBody): Promise<CardPaymentReturn> {
		const context = await resolvePayingCustomer(
			this.prisma,
			userId,
			{ cpf: data.holderCpf ?? data.cpf, orderId: data.orderId, slug: data.slug },
		);
		const { customer, order, user } = context;

		let cardToken: string;
		let brand = "unknown";
		let holderName = user.name;
		let holderDocument = (data.holderCpf ?? data.cpf)?.replace(/\D/g, "") ?? null;
		let tokenizedForSave: DomCardTokenResult | null = null;
		let savedCardToBackfillId: string | null = null;

		if (data.savedCardId) {
			const savedCard = await this.prisma.savedCard.findFirst({
				where: { customerId: customer.id, id: data.savedCardId },
			});
			if (!savedCard) throw new DomainError(PaymentErrors.SAVED_CARD_NOT_FOUND);

			cardToken = savedCard.cardToken;
			brand = savedCard.brand;
			holderName = savedCard.holderName;
			holderDocument = savedCard.holderDocument ?? holderDocument;
			if (!savedCard.holderDocument) savedCardToBackfillId = savedCard.id;
		} else if (data.card) {
			if (!holderDocument) throw new DomainError(PaymentErrors.DOCUMENT_REQUIRED);
			let tokenized: DomCardTokenResult;
			try {
				const domId = customer.domId ?? (await this.createDomCustomer(context, holderDocument));
				tokenized = await this.dom.createCardToken(domId, {
					cvv: data.card.cvv,
					exp_month: data.card.expMonth,
					exp_year: data.card.expYear,
					holder_document: holderDocument,
					holder_name: data.card.holderName,
					number: data.card.number.replace(/\D/g, ""),
				});
			} catch (error) {
				if (error instanceof PaymentProviderError) {
					throw new DomainError(PaymentErrors.CARD_TOKENIZATION_FAILED, error.message);
				}
				throw error;
			}

			cardToken = tokenized.token;
			brand = tokenized.brand;
			holderName = tokenized.holderName;
			if (data.saveCard) tokenizedForSave = tokenized;
		} else {
			throw new DomainError(PaymentErrors.CARD_REQUIRED);
		}
		if (!holderDocument) throw new DomainError(PaymentErrors.DOCUMENT_REQUIRED);
		if (!isValidCpf(holderDocument)) throw new DomainError(PaymentErrors.INVALID_DOCUMENT);

		const existing = await this.prisma.payment.findUnique({ where: { orderId: order.id } });
		if (existing?.status === "confirmed") throw new DomainError(PaymentErrors.PAYMENT_ALREADY_CONFIRMED);

		const phone = (customer.phone ?? user.phoneNumber ?? "").replace(/\D/g, "");

		let simpayPaymentId: string | null = null;
		let gatewayStatus = "";
		try {
			const result = await this.simpay.createCardPayment({
				bin: cardToken.substring(0, 6),
				brand,
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
			});
			simpayPaymentId = result.paymentId ?? result.id ?? null;
			gatewayStatus = result.status;
		} catch (error) {
			throw new DomainError(PaymentErrors.CARD_DECLINED, paymentProviderErrorDescription(error));
		}
		if (isFailedSimpayStatus(gatewayStatus)) {
			throw new DomainError(PaymentErrors.CARD_DECLINED);
		}

		if (tokenizedForSave) {
			const existingCards = await this.prisma.savedCard.count({ where: { customerId: customer.id } });
			await this.prisma.savedCard.create({
				data: {
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
				},
			});
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
			return { status: "confirmed", token: payment.token };
		}

		return { status: "pending", token: payment.token };
	}

	private async createDomCustomer(
		context: Awaited<ReturnType<typeof resolvePayingCustomer>>,
		document: string,
	) {
		const { customer, user } = context;

		const address = await this.prisma.address.findFirst({
			orderBy: { isDefault: "desc" },
			where: { customerId: customer.id },
		});

		const domId = await this.dom.createCustomer({
			address: address
				? {
						city: address.city ?? "",
						neighborhood: address.neighborhood ?? "",
						number: address.number,
						state: address.state ?? "",
						street: address.addressLine,
						zip_code: address.zipCode,
					}
				: undefined,
			codeExternal: customer.id,
			document,
			email: user.email,
			mobilePhone: (customer.phone ?? user.phoneNumber ?? "").replace(/\D/g, "") || undefined,
			name: user.name,
		});

		await this.prisma.customer.update({ data: { domId }, where: { id: customer.id } });

		return domId;
	}
}
