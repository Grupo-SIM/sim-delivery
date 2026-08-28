import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { PaymentStatusReturn } from "../dtos";
import { PaymentErrors } from "../errors";

export class GetPaymentStatus {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, token: string): Promise<PaymentStatusReturn> {
		const payment = await this.prisma.payment.findFirst({
			where: { order: { customer: { userId } }, token },
		});
		if (!payment) throw new DomainError(PaymentErrors.PAYMENT_NOT_FOUND);

		return { status: payment.status };
	}
}
