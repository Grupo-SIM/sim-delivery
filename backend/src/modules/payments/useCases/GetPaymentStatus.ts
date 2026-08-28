import { DomainError } from "@/shared/errors";
import { isApprovedSimpayStatus, isFailedSimpayStatus, type SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { PaymentStatusReturn } from "../dtos";
import { PaymentErrors } from "../errors";
import { ConfirmPayment } from "./ConfirmPayment";

export class GetPaymentStatus {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly simpay: SimpayClient,
	) {}

	async execute(userId: string, token: string): Promise<PaymentStatusReturn> {
		const payment = await this.prisma.payment.findFirst({
			where: { order: { customer: { userId } }, token },
		});
		if (!payment) throw new DomainError(PaymentErrors.PAYMENT_NOT_FOUND);
		if (payment.status !== "pending" || !payment.simpayPaymentId) return { status: payment.status };

		let remote: { status: string };
		try {
			remote =
				payment.method === "pix"
					? await this.simpay.getPixStatusDirect(payment.simpayPaymentId)
					: await this.simpay.getPaymentStatus(payment.simpayPaymentId);
		} catch {
			// Gateway status is best-effort. Preserve pending so a transient status outage
			// cannot turn an unsettled payment into either approval or rejection.
			return { status: payment.status };
		}

		if (isApprovedSimpayStatus(remote.status)) {
			const confirmed = await new ConfirmPayment(this.prisma).execute(payment.token, payment.simpayPaymentId);
			if (confirmed) return { status: "confirmed" };

			const current = await this.prisma.payment.findUnique({ where: { token: payment.token } });
			return { status: current?.status ?? payment.status };
		}

		if (isFailedSimpayStatus(remote.status)) {
			const { count } = await this.prisma.payment.updateMany({
				data: { status: "failed" },
				where: { id: payment.id, simpayPaymentId: payment.simpayPaymentId, status: "pending" },
			});
			if (count > 0) return { status: "failed" };

			const current = await this.prisma.payment.findUnique({ where: { token: payment.token } });
			return { status: current?.status ?? payment.status };
		}

		return { status: payment.status };
	}
}
