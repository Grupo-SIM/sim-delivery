import { DomainError } from "@/shared/errors";
import type { SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { PaymentStatusReturn } from "../dtos";
import { PaymentErrors } from "../errors";
import { ApplySimpayPaymentStatus } from "./ApplySimpayPaymentStatus";

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

		const result = await new ApplySimpayPaymentStatus(this.prisma).execute(
			payment.simpayPaymentId,
			remote.status,
		);
		return { status: result.status };
	}
}
