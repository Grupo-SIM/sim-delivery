import { paymentStatusEvents } from "@/modules/payments/infra/PaymentStatusEvents";
import { isApprovedSimpayStatus, isFailedSimpayStatus, type SimpayChargeAmounts } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ConfirmPayment } from "./ConfirmPayment";

export interface AppliedPaymentStatus {
	found: boolean;
	status: string;
}

/** Applies a trusted Simpay status to the local payment exactly once. */
export class ApplySimpayPaymentStatus {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(simpayPaymentId: string, remoteStatus: string, companyId?: string, coproductionCents = 0, sellerFeeCents = 0, amounts: SimpayChargeAmounts = {}): Promise<AppliedPaymentStatus> {
		const payment = await this.prisma.payment.findFirst({ where: { simpayPaymentId, ...(companyId ? { order: { companyId } } : {}) } });
		if (!payment) return { found: false, status: "not_found" };
		if (payment.status !== "pending") return { found: true, status: payment.status };

		if (isApprovedSimpayStatus(remoteStatus)) {
			// SimIntPay's settled net replaces any value stored at charge time; historical charges have none.
			const settled = { ...(amounts.netAmountCents != null ? { netAmountCents: amounts.netAmountCents } : {}), ...(amounts.totalAmountCents != null ? { totalAmountCents: amounts.totalAmountCents } : {}) };
			if (coproductionCents > 0 || sellerFeeCents > 0 || Object.keys(settled).length > 0) await this.prisma.payment.update({ data: { coproductionCents, sellerFeeCents, ...settled }, where: { id: payment.id } });
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
