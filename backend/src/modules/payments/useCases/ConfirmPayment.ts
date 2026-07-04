import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { PaymentErrors } from "../errors";

export class ConfirmPayment {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(token: string): Promise<void> {
		const payment = await this.prisma.payment.findUnique({ where: { token } });
		if (!payment) throw new DomainError(PaymentErrors.PAYMENT_NOT_FOUND);
		if (payment.status === "confirmed") throw new DomainError(PaymentErrors.PAYMENT_ALREADY_CONFIRMED);

		await this.prisma.$transaction(async tx => {
			await tx.payment.update({
				data: { status: "confirmed" },
				where: { id: payment.id },
			});
			await tx.order.update({
				data: { status: "recebido" },
				where: { id: payment.orderId },
			});
		});
	}
}
