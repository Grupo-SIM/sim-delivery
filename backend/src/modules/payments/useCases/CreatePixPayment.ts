import { startPaymentAttempt, recoverPaymentAttempt, recordAttemptResponse } from "./payment-attempts";
import { DomainError } from "@/shared/errors";
import type { SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CreatePixPaymentBody, PixPaymentReturn } from "../dtos";
import { PaymentErrors } from "../errors";
import { buildPaymentDescription, resolvePayingCustomer } from "./resolvePayingCustomer";

export class CreatePixPayment {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly simpay: SimpayClient,
	) {}

	async execute(userId: string, data: CreatePixPaymentBody): Promise<PixPaymentReturn> {
		const context = await resolvePayingCustomer(this.prisma, userId, data);
		const { customer, document, merchant, order, user } = context;
		if (!document) throw new DomainError(PaymentErrors.DOCUMENT_REQUIRED);

		// Re-poll the same charge instead of creating a duplicate when the customer
		// refreshes the payment step with a PIX already pending.
		const existing = await this.prisma.payment.findUnique({ where: { orderId: order.id } });
		if (existing?.status === "pending" && existing.method === "pix" && existing.pixQrcode) {
			return {
				amount: existing.amount,
				pixContent: existing.pixContent ?? "",
				pixQrcode: existing.pixQrcode,
				token: existing.token,
			};
		}

		const { attempt, created } = await startPaymentAttempt(this.prisma, context, "pix");
		if (!created) {
			const { payment } = await recoverPaymentAttempt(this.prisma, this.simpay, context, attempt.id);
			if (!payment.pixContent || !payment.pixQrcode) throw new DomainError(PaymentErrors.PAYMENT_PROCESSING);
			return { amount: payment.amount, pixContent: payment.pixContent, pixQrcode: payment.pixQrcode, token: payment.token };
		}
		await this.prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { state: "submitting" } });
		const phone = (customer.phone ?? user.phoneNumber ?? "").replace(/\D/g, "");
		const pix = await this.simpay.createPixPayment({
			idempotencyKey: attempt.id,
			allocation: { merchantAmountCents: order.total - order.feeTotalCents, platformFeeCents: order.feeTotalCents },
			description: buildPaymentDescription(order),
			document,
			document_type: document.length === 11 ? "CPF" : "CNPJ",
			email: user.email,
			mobile_phone: phone || undefined,
			name: user.name,
			price: order.total / 100,
		}, merchant);

		await recordAttemptResponse(this.prisma, attempt.id, pix);
		// The gateway answers 201 even when DOM declines the charge (e.g. invalid CPF),
		// leaving the QR fields empty. Surface that as a clear error instead of a broken QR.
		const qrcode = pix.pix_qrcode || pix.pix_qrcode_url;
		if (!qrcode || !pix.pix_content) {
			const reason = pix.internal_msg ?? pix.status_details ?? pix.message ?? "";
			if (/cpf|cnpj|documento|document/i.test(reason)) {
				throw new DomainError(PaymentErrors.INVALID_DOCUMENT);
			}
			throw new DomainError(PaymentErrors.PIX_FAILED);
		}

		const simpayPaymentId = pix.paymentId ?? pix.id ?? null;

		const payment = existing
			? await this.prisma.payment.update({
					data: {
						amount: order.total,
						method: "pix",
						pixContent: pix.pix_content,
						pixQrcode: qrcode,
						simpayPaymentId,
						status: "pending",
					},
					where: { id: existing.id },
				})
			: await this.prisma.payment.create({
					data: {
						amount: order.total,
						method: "pix",
						orderId: order.id,
						pixContent: pix.pix_content,
						pixQrcode: qrcode,
						simpayPaymentId,
					},
				});

		return {
			amount: payment.amount,
			pixContent: pix.pix_content,
			pixQrcode: qrcode,
			token: payment.token,
		};
	}
}
