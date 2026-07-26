import writeXlsxFile from "write-excel-file/node";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { GetReportsQuery } from "../dtos";
import { getReportDateRange } from "../utils/reportPeriod";
import { buildReportSheets } from "../utils/reportSheets";
import type { GetBestSellers } from "./GetBestSellers";
import type { GetDashboardAnalytics } from "./GetDashboardAnalytics";
import type { GetRevenueSummary } from "./GetRevenueSummary";

export class ExportReports {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly getRevenueSummary: GetRevenueSummary,
		private readonly getBestSellers: GetBestSellers,
		private readonly getDashboardAnalytics: GetDashboardAnalytics,
	) {}

	async execute(companyId: string | null, query: GetReportsQuery): Promise<Buffer> {
		const { endDate, period, startDate, unitId } = query;
		const now = new Date();
		const { since, until } = getReportDateRange(period, startDate, endDate, now);

		const [summary, bestSellers, analytics, orders] = await Promise.all([
			this.getRevenueSummary.execute(companyId, query),
			// `null` lifts the dashboard's top-10 cap: the whole point of the export is the full data.
			this.getBestSellers.execute(companyId, query, null),
			this.getDashboardAnalytics.execute(companyId, query),
			// No status filter here: unlike the dashboard, the "Pedidos" sheet lists cancelled orders too.
			this.prisma.order.findMany({
				include: {
					coupon: { select: { code: true } },
					customer: { include: { user: { select: { name: true } } } },
					items: { include: { optionSnapshots: true } },
					unit: { select: { name: true } },
				},
				orderBy: { createdAt: "desc" },
				where: {
					...(companyId ? { companyId } : {}),
					...(unitId ? { unitId } : {}),
					...(since || until
						? { createdAt: { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } }
						: {}),
				},
			}),
		]);

		return writeXlsxFile(
			buildReportSheets({ analytics, bestSellers, now, orders, since, summary, until }),
		).toBuffer();
	}
}
