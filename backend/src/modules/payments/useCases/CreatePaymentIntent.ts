import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CreatePaymentIntentBody, PaymentIntentReturn } from "../dtos";
import { PaymentErrors } from "../errors";

export class CreatePaymentIntent {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly backendUrl: string,
	) {}

	async execute(userId: string, data: CreatePaymentIntentBody): Promise<PaymentIntentReturn> {
		const { orderId, slug } = data;

		const company = await this.prisma.company.findUnique({ where: { slug } });

		const customer = company
			? await this.prisma.customer.findFirst({ where: { companyId: company.id, userId } })
			: null;

		const order = await this.prisma.order.findUnique({ where: { id: orderId } });
		if (!order) throw new DomainError(PaymentErrors.ORDER_NOT_FOUND);

		if (!customer || order.customerId !== customer.id) {
			throw new DomainError(PaymentErrors.UNAUTHORIZED_ORDER);
		}

		const payment = await this.prisma.payment.create({
			data: { amount: order.total, orderId },
		});

		return {
			paymentUrl: `${this.backendUrl}/pay/${payment.token}`,
			token: payment.token,
		};
	}
}
