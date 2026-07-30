import writeXlsxFile from "write-excel-file/node";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { GetReportsQuery } from "../dtos";
import { getReportDateRange } from "../utils/reportPeriod";
import { buildReportSheets } from "../utils/reportSheets";
import type { GetBestSellers } from "./GetBestSellers";
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
	) {}

	async execute(companyId: string | null, query: GetReportsQuery): Promise<Buffer> {
		const now = new Date();
		const { since, until } = getReportDateRange(query.period, query.startDate, query.endDate, now);
		const [summary, bestSellers, analytics, financial, orders] = await Promise.all([
			this.getRevenueSummary.execute(companyId, query),
			this.getBestSellers.execute(companyId, query, null),
			this.getDashboardAnalytics.execute(companyId, query),
			this.getFinancialAnalytics.execute(companyId, query),
			this.prisma.order.findMany({
				include: { coupon: { select: { code: true } }, customer: { include: { user: { select: { name: true } } } }, items: { include: { optionSnapshots: true } }, unit: { select: { name: true } } },
				orderBy: { createdAt: "desc" },
				where: { ...(companyId ? { companyId } : {}), ...(query.unitId ? { unitId: query.unitId } : {}), ...(since || until ? { createdAt: { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } } : {}) },
			}),
		]);
		return writeXlsxFile(buildReportSheets({ analytics, bestSellers, financial, now, orders, since, summary, until })).toBuffer();
	}
}
