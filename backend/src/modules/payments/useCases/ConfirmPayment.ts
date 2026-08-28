import { DomainError } from "@/shared/errors";
import { OrderStatusEmail } from "@/shared/infra/emails";
import type { PrismaInstance } from "@/shared/infra/sql";
import { formatOrderStatusMessage } from "@/modules/orders/order-status-message";
import { PaymentErrors } from "../errors";

interface OrderStatusEmailSender {
	send(input: { message: string; orderId: string; status: string; to: string }): Promise<void>;
}

const orderStatusEmailSender: OrderStatusEmailSender = {
	send: input => new OrderStatusEmail(input).send(),
};

export class ConfirmPayment {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly emailSender: OrderStatusEmailSender = orderStatusEmailSender,
	) {}

	async execute(token: string, expectedSimpayPaymentId?: string): Promise<boolean> {
		const payment = await this.prisma.payment.findUnique({ where: { token } });
		if (!payment) throw new DomainError(PaymentErrors.PAYMENT_NOT_FOUND);

		const order = await this.prisma.order.findUniqueOrThrow({
			include: { customer: { select: { notificationEmail: true, user: { select: { email: true } } } }, unit: true },
			where: { id: payment.orderId },
		});

		const earnedCashbackCents = Math.floor((order.total * order.unit.cashbackPercent) / 100);
		const earnedLoyaltyPoints = Math.floor((order.total * order.unit.loyaltyPointsRate) / 100);

		const confirmed = await this.prisma.$transaction(async tx => {
			// Webhooks can be retried or delivered concurrently. Claiming the pending
			// row inside the transaction ensures rewards and order transition run once.
			const { count } = await tx.payment.updateMany({
				data: { confirmedAt: new Date(), status: "confirmed" },
				where: {
					id: payment.id,
					...(expectedSimpayPaymentId ? { simpayPaymentId: expectedSimpayPaymentId } : {}),
					status: "pending",
				},
			});
			if (count === 0) return false;

			await tx.order.update({
				data: { status: "recebido" },
				where: { id: order.id },
			});

			if (earnedCashbackCents > 0) {
				await tx.cashbackLedger.create({
					data: {
						amount: earnedCashbackCents,
						customerId: order.customerId,
						orderId: order.id,
						type: "accrual",
					},
				});
			}

			if (earnedLoyaltyPoints > 0) {
				await tx.loyaltyLedger.create({
					data: {
						amount: earnedLoyaltyPoints,
						customerId: order.customerId,
						orderId: order.id,
						type: "earn",
					},
				});
			}

			return true;
		});

		if (confirmed && order.customer.notificationEmail !== false && order.customer.user.email) {
			await this.emailSender
				.send({
					message: formatOrderStatusMessage(undefined, "recebido", order.id),
					orderId: order.id,
					status: "recebido",
					to: order.customer.user.email,
				})
				.catch(() => {});
		}

		return confirmed;
	}
}
