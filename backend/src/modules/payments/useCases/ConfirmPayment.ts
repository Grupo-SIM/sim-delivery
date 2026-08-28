import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { PaymentErrors } from "../errors";

export class ConfirmPayment {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(token: string): Promise<boolean> {
		const payment = await this.prisma.payment.findUnique({ where: { token } });
		if (!payment) throw new DomainError(PaymentErrors.PAYMENT_NOT_FOUND);

		const order = await this.prisma.order.findUniqueOrThrow({
			include: { unit: true },
			where: { id: payment.orderId },
		});

		const earnedCashbackCents = Math.floor((order.total * order.unit.cashbackPercent) / 100);
		const earnedLoyaltyPoints = Math.floor((order.total * order.unit.loyaltyPointsRate) / 100);

		return this.prisma.$transaction(async tx => {
			// Webhooks can be retried or delivered concurrently. Claiming the pending
			// row inside the transaction ensures rewards and order transition run once.
			const { count } = await tx.payment.updateMany({
				data: { confirmedAt: new Date(), status: "confirmed" },
				where: { id: payment.id, status: "pending" },
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
	}
}
