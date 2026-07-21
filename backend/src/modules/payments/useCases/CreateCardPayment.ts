import { DomainError } from "@/shared/errors";
import type { DomPagamentosClient } from "@/shared/infra/domPagamentos";
import type { SimpayClient } from "@/shared/infra/simpay";
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
		const context = await resolvePayingCustomer(this.prisma, userId, data);
		const { customer, document, order, user } = context;

		// Card charges require the holder's document (tokenization + gateway validation).
		if (!document) throw new DomainError(PaymentErrors.DOCUMENT_REQUIRED);

		let cardToken: string;
		let brand = "unknown";
		let holderName = user.name;

		if (data.savedCardId) {
			const savedCard = await this.prisma.savedCard.findFirst({
				where: { customerId: customer.id, id: data.savedCardId },
			});
			if (!savedCard) throw new DomainError(PaymentErrors.SAVED_CARD_NOT_FOUND);

			cardToken = savedCard.cardToken;
			brand = savedCard.brand;
			holderName = savedCard.holderName;
		} else if (data.card) {
			const domId = customer.domId ?? (await this.createDomCustomer(context, document));

			const tokenized = await this.dom.createCardToken(domId, {
				cvv: data.card.cvv,
				exp_month: data.card.expMonth,
				exp_year: data.card.expYear,
				holder_document: document,
				holder_name: data.card.holderName,
				number: data.card.number.replace(/\D/g, ""),
			});

			cardToken = tokenized.token;
			brand = tokenized.brand;
			holderName = tokenized.holderName;

			if (data.saveCard) {
				const existingCards = await this.prisma.savedCard.count({ where: { customerId: customer.id } });
				await this.prisma.savedCard.create({
					data: {
						brand: tokenized.brand,
						cardToken: tokenized.token,
						customerId: customer.id,
						expiryMonth: tokenized.expiryMonth,
						expiryYear: tokenized.expiryYear,
						holderName: tokenized.holderName,
						isDefault: existingCards === 0,
						last4: tokenized.last4,
						nickname: data.cardNickname?.trim() || null,
					},
				});
			}
		} else {
			throw new DomainError(PaymentErrors.CARD_REQUIRED);
		}

		const existing = await this.prisma.payment.findUnique({ where: { orderId: order.id } });
		if (existing?.status === "confirmed") throw new DomainError(PaymentErrors.PAYMENT_ALREADY_CONFIRMED);

		const phone = (customer.phone ?? user.phoneNumber ?? "").replace(/\D/g, "");

		let simpayPaymentId: string | null = null;
		try {
			const result = await this.simpay.createCardPayment({
				bin: cardToken.substring(0, 6),
				brand,
				description: buildPaymentDescription(order),
				document,
				document_type: document.length === 11 ? "CPF" : "CNPJ",
				email: user.email,
				holder_name: holderName,
				installments: 1,
				mobile_phone: phone || undefined,
				name: user.name,
				price: order.total / 100,
				token: cardToken,
			});
			simpayPaymentId = result.paymentId ?? result.id ?? null;
		} catch {
			throw new DomainError(PaymentErrors.CARD_DECLINED);
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

		// Card charges resolve synchronously at the gateway (same as Atlas): a successful
		// createCardPayment call means the charge went through, so confirm right away.
		await new ConfirmPayment(this.prisma).execute(payment.token);

		return { status: "confirmed", token: payment.token };
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
