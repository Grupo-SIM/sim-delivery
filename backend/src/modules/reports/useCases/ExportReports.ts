import writeXlsxFile from "write-excel-file/node";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { GetReportsQuery } from "../dtos";
import { getReportDateRange } from "../utils/reportPeriod";
import { buildReportSheets } from "../utils/reportSheets";
import type { GetBestSellers } from "./GetBestSellers";
import type { GetBusinessMetrics } from "./GetBusinessMetrics";
import type { GetDashboardAnalytics } from "./GetDashboardAnalytics";
import type { GetFinancialAnalytics } from "./GetFinancialAnalytics";
import type { GetRevenueSummary } from "./GetRevenueSummary";

export class ExportReports {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly getRevenueSummary: GetRevenueSummary,
		private readonly getBestSellers: GetBestSellers,
		private readonly getDashboardAnalytics: GetDashboardAnalytics,
		private readonly getFinancialAnalytics: GetFinancialAnalytics,
		private readonly getBusinessMetrics: GetBusinessMetrics,
	) {}

	async execute(companyId: string | null, query: GetReportsQuery, permittedUnitIds?: string[]): Promise<Buffer> {
		const now = new Date();
		const { since, until } = getReportDateRange(query.period, query.startDate, query.endDate, now);
		const [summary, bestSellers, analytics, financial, business, orders] = await Promise.all([
			this.getRevenueSummary.execute(companyId, query, permittedUnitIds),
			this.getBestSellers.execute(companyId, query, null, permittedUnitIds),
			this.getDashboardAnalytics.execute(companyId, query, permittedUnitIds),
			this.getFinancialAnalytics.execute(companyId, query, permittedUnitIds),
			this.getBusinessMetrics.execute(companyId, query, permittedUnitIds),
			this.prisma.order.findMany({
				include: {
					coupon: { select: { code: true } },
					customer: { include: { user: { select: { name: true } } } },
					items: { include: { optionSnapshots: true } },
					payment: { select: { coproductionCents: true, simintpayFeeCents: true } },
					unit: { select: { name: true } },
				},
				orderBy: { createdAt: "desc" },
				where: {
					...(companyId ? { companyId } : {}),
					...(query.unitId
						? { unitId: query.unitId }
						: permittedUnitIds
							? { unitId: { in: permittedUnitIds } }
							: {}),
					...(since || until
						? { createdAt: { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } }
						: {}),
				},
			}),
		]);
		return writeXlsxFile(
			buildReportSheets({ analytics, bestSellers, business, financial, now, orders, since, summary, until }),
		).toBuffer();
	}
}
