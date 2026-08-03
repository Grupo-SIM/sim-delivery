import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { SimpayClient } from "@/shared/infra/simpay";
import type { RefundMethod, RefundPaymentBody, RefundReturn } from "../dtos";
import { PaymentErrors } from "../errors";

/**
 * Registers a refund against an order's payment, reversing the cashback/loyalty accrued
 * for it and — for a full refund — the amounts the customer redeemed at checkout. The
 * system is the accounting source of truth; gateway settlement (`method: "gateway"`) is
 * attempted through `SimpayClient.refundPayment`, which currently always fails until that
 * API is documented, leaving the refund recorded as `failed` rather than silently lost.
 */
export class RefundPayment {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly simpay: SimpayClient,
	) {}

	async execute(
		companyId: string | null,
		orderId: string,
		data: RefundPaymentBody,
		userId?: string,
	): Promise<RefundReturn> {
		const order = await this.prisma.order.findFirst({
			include: { payment: true },
			where: { ...(companyId ? { companyId } : {}), id: orderId },
		});
		if (!order) throw new DomainError(PaymentErrors.ORDER_NOT_FOUND);
		const payment = order.payment;
		if (!payment || payment.status === "pending" || payment.status === "failed")
			throw new DomainError(PaymentErrors.PAYMENT_NOT_REFUNDABLE);

		const remaining = payment.amount - payment.refundedAmount;
		const amount = data.amount ?? remaining;
		if (amount <= 0 || amount > remaining) throw new DomainError(PaymentErrors.REFUND_EXCEEDS_PAYMENT);

		const method = data.method as RefundMethod;
		let externalId: string | null = null;
		let status: "completed" | "failed" = "completed";
		if (method === "gateway") {
			try {
				const result = payment.simpayPaymentId
					? await this.simpay.refundPayment(payment.simpayPaymentId, amount)
					: null;
				externalId = result?.externalId ?? null;
			} catch {
				status = "failed";
			}
		}

		const isFullRefund = amount === remaining;

		const refund = await this.prisma.$transaction(async tx => {
			const created = await tx.refund.create({
				data: {
					amount,
					companyId: order.companyId,
					externalId,
					method,
					orderId: order.id,
					paymentId: payment.id,
					reason: data.reason ?? null,
					status,
					userId: userId ?? null,
				},
			});

			if (status === "completed") {
				const refundedAmount = payment.refundedAmount + amount;
				await tx.payment.update({
					data: {
						refundedAmount,
						refundedAt: new Date(),
						status: refundedAmount >= payment.amount ? "refunded" : "partially_refunded",
					},
					where: { id: payment.id },
				});
				await tx.order.update({
					data: { refundedCents: { increment: amount } },
					where: { id: order.id },
				});

				if (isFullRefund) {
					const accrual = await tx.cashbackLedger.aggregate({
						_sum: { amount: true },
						where: { orderId: order.id, type: "accrual" },
					});
					if (accrual._sum.amount)
						await tx.cashbackLedger.create({
							data: {
								amount: -accrual._sum.amount,
								customerId: order.customerId,
								orderId: order.id,
								type: "reversal",
							},
						});

					const earned = await tx.loyaltyLedger.aggregate({
						_sum: { amount: true },
						where: { orderId: order.id, type: "earn" },
					});
					if (earned._sum.amount)
						await tx.loyaltyLedger.create({
							data: {
								amount: -earned._sum.amount,
								customerId: order.customerId,
								orderId: order.id,
								type: "reversal",
							},
						});

					if (order.cashbackCentsRedeemed > 0)
						await tx.cashbackLedger.create({
							data: {
								amount: order.cashbackCentsRedeemed,
								customerId: order.customerId,
								orderId: order.id,
								type: "reversal",
							},
						});
					if (order.loyaltyPointsRedeemed > 0)
						await tx.loyaltyLedger.create({
							data: {
								amount: order.loyaltyPointsRedeemed,
								customerId: order.customerId,
								orderId: order.id,
								type: "reversal",
							},
						});
				}
			}

			return created;
		});

		// A failed gateway refund is recorded (status "failed") rather than thrown, so a
		// caller cancelling an order doesn't have its own transition rolled back by a
		// gateway that doesn't support refunds yet — the failure is visible on the record.
		return {
			amount: refund.amount,
			createdAt: refund.createdAt.toISOString(),
			externalId: refund.externalId,
			id: refund.id,
			method: refund.method as RefundMethod,
			reason: refund.reason,
			status: refund.status,
		};
	}
}
