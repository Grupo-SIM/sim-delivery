import { DomainError } from "@/shared/errors";
import { simpayIntegrationKey, type SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { PaymentStatusReturn } from "../dtos";
import { PaymentErrors } from "../errors";
import { ApplySimpayPaymentStatus } from "./ApplySimpayPaymentStatus";

export class GetPaymentStatus {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly simpay: SimpayClient,
	) {}

	async execute(userId: string, token: string, reconcileRemote = true): Promise<PaymentStatusReturn> {
		const payment = await this.prisma.payment.findFirst({
			include: { order: { select: { company: { select: { cnpj: true, id: true, slug: true } } } } },
			where: { order: { customer: { userId } }, token },
		});
		if (!payment) throw new DomainError(PaymentErrors.PAYMENT_NOT_FOUND);
		if (!reconcileRemote || payment.status !== "pending" || !payment.simpayPaymentId) return { status: payment.status };

		let remote: { status: string };
		try {
			const merchant = payment.order?.company
				? { externalMerchantId: payment.order.company.id, integrationKey: simpayIntegrationKey(payment.order.company.slug) }
				: undefined;
			remote =
				payment.method === "pix"
					? await this.simpay.getPixStatusDirect(payment.simpayPaymentId, merchant)
					: await this.simpay.getPaymentStatus(payment.simpayPaymentId, merchant);
		} catch (error) {
			console.error(`[PaymentStatus] SimIntPay query failed paymentId=${payment.id} simpayPaymentId=${payment.simpayPaymentId}`, error);
			// Gateway status is best-effort. Preserve pending so a transient status outage
			// cannot turn an unsettled payment into either approval or rejection.
			const persisted = await this.prisma.payment.findUnique({ where: { token }, select: { status: true } });
			return { status: persisted?.status ?? payment.status };
		}

		const result = await new ApplySimpayPaymentStatus(this.prisma).execute(
			payment.simpayPaymentId,
			remote.status,
		);
		return { status: result.status };
	}
}
