import { paymentStatusEvents } from "@/modules/payments/infra/PaymentStatusEvents";
import { isApprovedSimpayStatus, isFailedSimpayStatus } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ConfirmPayment } from "./ConfirmPayment";

export interface AppliedPaymentStatus {
	found: boolean;
	status: string;
}

/** Applies a trusted Simpay status to the local payment exactly once. */
export class ApplySimpayPaymentStatus {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(simpayPaymentId: string, remoteStatus: string, companyId?: string, coproductionCents = 0, simintpayFeeCents = 0): Promise<AppliedPaymentStatus> {
		const payment = await this.prisma.payment.findFirst({ where: { simpayPaymentId, ...(companyId ? { order: { companyId } } : {}) } });
		if (!payment) return { found: false, status: "not_found" };
		if (payment.status !== "pending") return { found: true, status: payment.status };

		if (isApprovedSimpayStatus(remoteStatus)) {
			if (coproductionCents > 0 || simintpayFeeCents > 0) await this.prisma.payment.update({ data: { coproductionCents, simintpayFeeCents }, where: { id: payment.id } });
			const confirmed = await new ConfirmPayment(this.prisma).execute(payment.token, simpayPaymentId);
			const status = confirmed
				? "confirmed"
				: ((await this.prisma.payment.findUnique({ where: { token: payment.token } }))?.status ?? payment.status);
			if (status === "confirmed") paymentStatusEvents.publish(payment.token, status);
			return { found: true, status };
		}

		if (isFailedSimpayStatus(remoteStatus)) {
			const { count } = await this.prisma.payment.updateMany({
				data: { status: "failed" },
				where: { id: payment.id, simpayPaymentId, status: "pending" },
			});
			const status = count > 0
				? "failed"
				: ((await this.prisma.payment.findUnique({ where: { token: payment.token } }))?.status ?? payment.status);
			if (status === "failed") paymentStatusEvents.publish(payment.token, status);
			return { found: true, status };
		}

		return { found: true, status: payment.status };
	}
}
