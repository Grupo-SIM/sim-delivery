import { simpayIntegrationKey, type SimpayClient, type SimpayReconciliationResult } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";

export interface CompanyReconciliationResult extends SimpayReconciliationResult {
	companyId: string;
	integrationKey: string;
	paymentCount: number;
}

export class ReconcileSimpayPayments {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly simpay: SimpayClient,
	) {}

	async execute(dryRun = true): Promise<CompanyReconciliationResult[]> {
		const payments = await this.prisma.payment.findMany({
			select: { order: { select: { companyId: true } }, simpayPaymentId: true },
			where: { simpayPaymentId: { not: null }, status: "confirmed" },
		});
		const grouped = new Map<string, string[]>();
		for (const payment of payments) {
			if (!payment.simpayPaymentId) continue;
			const companyPayments = grouped.get(payment.order.companyId) ?? [];
			companyPayments.push(payment.simpayPaymentId);
			grouped.set(payment.order.companyId, companyPayments);
		}

		const results: CompanyReconciliationResult[] = [];
		for (const [companyId, paymentIds] of grouped) {
			const company = await this.prisma.company.findUnique({
				select: { cnpj: true, slug: true },
				where: { id: companyId },
			});
			if (!company?.cnpj) continue;
			const integrationKey = simpayIntegrationKey(company.slug);
			const result = await this.simpay.reconcilePayments(
				{ externalMerchantId: companyId, integrationKey },
				paymentIds,
				dryRun,
			);
			results.push({ ...result, companyId, integrationKey, paymentCount: paymentIds.length });
		}
		return results;
	}
}
