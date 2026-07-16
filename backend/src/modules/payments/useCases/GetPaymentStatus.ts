import { DomainError } from "@/shared/errors";
import type { SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { PaymentStatusReturn } from "../dtos";
import { PaymentErrors } from "../errors";
import { ConfirmPayment } from "./ConfirmPayment";

const COMPLETED_STATUSES = new Set(["APPROVED", "COMPLETED", "PAID"]);

export class GetPaymentStatus {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly simpay: SimpayClient,
	) {}

	async execute(token: string): Promise<PaymentStatusReturn> {
		const payment = await this.prisma.payment.findUnique({ where: { token } });
		if (!payment) throw new DomainError(PaymentErrors.PAYMENT_NOT_FOUND);

		if (payment.status !== "pending" || !payment.simpayPaymentId) {
			return { status: payment.status };
		}

		// DOM-direct check first (no webhook wait), then the Simpay DB status as fallback —
		// same order Atlas polls in.
		let isCompleted = false;

		const direct = await this.simpay.getPixStatusDirect(payment.simpayPaymentId);
		if (COMPLETED_STATUSES.has(direct.status)) isCompleted = true;

		if (!isCompleted) {
			try {
				const remote = await this.simpay.getPaymentStatus(payment.simpayPaymentId);
				if (COMPLETED_STATUSES.has(remote.status)) isCompleted = true;
			} catch {
				// Status service momentarily unavailable — stay pending, the storefront polls again.
			}
		}

		if (!isCompleted) return { status: "pending" };

		await new ConfirmPayment(this.prisma).execute(payment.token);
		return { status: "confirmed" };
	}
}
