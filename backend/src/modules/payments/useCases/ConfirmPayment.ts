import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { PaymentErrors } from "../errors";

export class ConfirmPayment {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(token: string): Promise<void> {
		const payment = await this.prisma.payment.findUnique({ where: { token } });
		if (!payment) throw new DomainError(PaymentErrors.PAYMENT_NOT_FOUND);
		if (payment.status === "confirmed") throw new DomainError(PaymentErrors.PAYMENT_ALREADY_CONFIRMED);

		const order = await this.prisma.order.findUniqueOrThrow({
			include: { unit: true },
			where: { id: payment.orderId },
		});

		const earnedCashbackCents = Math.floor(order.total * order.unit.cashbackPercent / 100);
		const earnedLoyaltyPoints = Math.floor(order.total * order.unit.loyaltyPointsRate / 100);

		await this.prisma.$transaction(async tx => {
			await tx.payment.update({
				data: { status: "confirmed" },
				where: { id: payment.id },
			});

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
		});
	}
}
