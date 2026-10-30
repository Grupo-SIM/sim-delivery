import { recoverPaymentAttempt } from "./payment-attempts";
import { resolvePayingCustomer } from "./resolvePayingCustomer";
import { drainCanonicalWebhooks } from "./canonical-webhooks";
import { simpayIntegrationKey, type SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ApplySimpayPaymentStatus } from "./ApplySimpayPaymentStatus";

const RECONCILIATION_INTERVAL_MS = 5_000;

export class ReconcilePendingPayments {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly simpay: SimpayClient,
	) {}

	async execute(): Promise<number> {
		// Each deploy serves one company; never reconcile (and notify) another company's payments.
		const slug = process.env.COMPANY_SLUG?.trim();
		if (!slug) return 0;
		const company = await this.prisma.company.findUnique({ select: { id: true }, where: { slug } });
		if (!company) return 0;

		const attempts = await this.prisma.paymentAttempt.findMany({ where: { companyId: company.id, state: { in: ["submitting", "pending"] } }, orderBy: { updatedAt: "asc" }, take: 100 });
		for (const attempt of attempts) {
			try {
				const order = await this.prisma.order.findUnique({ where: { id: attempt.orderId }, include: { customer: true, company: true } });
				if (!order || order.status !== "awaiting_payment") continue;
				const context = await resolvePayingCustomer(this.prisma, order.customer.userId, { orderId: order.id, slug: order.company.slug });
				await recoverPaymentAttempt(this.prisma, this.simpay, context, attempt.id);
			} catch { /* Preserve uncertainty; never issue a second charge. */ }
		}
		await drainCanonicalWebhooks(this.prisma, this.simpay, company.id);
		const payments = await this.prisma.payment.findMany({
			select: { method: true, order: { select: { company: { select: { cnpj: true, id: true, slug: true } } } }, simpayPaymentId: true },
			where: {
				method: { in: ["pix", "credit_card"] },
				order: { companyId: company.id, status: "awaiting_payment" },
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
				const merchant = payment.order?.company
					? { externalMerchantId: payment.order.company.id, integrationKey: simpayIntegrationKey(payment.order.company.slug) }
					: undefined;
				const remote = payment.method === "pix"
					? await this.simpay.getPixStatusDirect(paymentId, merchant)
					: await this.simpay.getPaymentStatus(paymentId, merchant);
				const result = await applyStatus.execute(paymentId, remote.status, undefined, remote.coproductionCents);
				if (result.status !== "pending") reconciled += 1;
			} catch (error) {
				console.error(`Failed to reconcile payment ${paymentId}`, error);
			}
		}

		return reconciled;
	}
}

export function startPendingPaymentReconciliation(
	prisma: PrismaInstance,
	simpay: SimpayClient,
): () => void {
	const reconciliation = new ReconcilePendingPayments(prisma, simpay);
	let running = false;
	const run = async () => {
		if (running) return;
		running = true;
		try {
			await reconciliation.execute();
		} catch (error) {
			console.error("Failed to reconcile pending payments", error);
		} finally {
			running = false;
		}
	};

	void run();
	const timer = setInterval(() => void run(), RECONCILIATION_INTERVAL_MS);
	timer.unref();
	return () => clearInterval(timer);
}
