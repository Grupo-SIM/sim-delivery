import { simpayIntegrationKey, type SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ApplySimpayPaymentStatus } from "./ApplySimpayPaymentStatus";

const RECONCILIATION_INTERVAL_MS = 30_000;

export class ReconcilePendingPixPayments {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly simpay: SimpayClient,
	) {}

	async execute(): Promise<number> {
		const payments = await this.prisma.payment.findMany({
			select: { order: { select: { company: { select: { cnpj: true, id: true, slug: true } } } }, simpayPaymentId: true },
			where: {
				method: "pix",
				order: { status: "awaiting_payment" },
				simpayPaymentId: { not: null },
				status: "pending",
			},
		});
		const applyStatus = new ApplySimpayPaymentStatus(this.prisma);
		let reconciled = 0;

		for (const payment of payments) {
			const paymentId = payment.simpayPaymentId;
			if (!paymentId) continue;

			try {
				const merchant = payment.order?.company.cnpj
					? { externalMerchantId: payment.order.company.id, integrationKey: simpayIntegrationKey(payment.order.company.slug) }
					: undefined;
				const remote = await this.simpay.getPixStatusDirect(paymentId, merchant);
				const result = await applyStatus.execute(paymentId, remote.status);
				if (result.status !== "pending") reconciled += 1;
			} catch (error) {
				console.error(`Failed to reconcile PIX payment ${paymentId}`, error);
			}
		}

		return reconciled;
	}
}

export function startPendingPixPaymentReconciliation(
	prisma: PrismaInstance,
	simpay: SimpayClient,
): () => void {
	const reconciliation = new ReconcilePendingPixPayments(prisma, simpay);
	let running = false;
	const run = async () => {
		if (running) return;
		running = true;
		try {
			await reconciliation.execute();
		} catch (error) {
			console.error("Failed to reconcile pending PIX payments", error);
		} finally {
			running = false;
		}
	};

	void run();
	const timer = setInterval(() => void run(), RECONCILIATION_INTERVAL_MS);
	timer.unref();
	return () => clearInterval(timer);
}
