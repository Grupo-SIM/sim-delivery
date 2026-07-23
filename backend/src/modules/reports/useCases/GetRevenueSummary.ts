import type { PrismaInstance } from "@/shared/infra/sql";
import type { GetReportsQuery, RevenueSummaryReturn } from "../dtos";
import { getReportDateRange } from "../utils/reportPeriod";

const COMPLETED = ["entregue", "retirado"];

export class GetRevenueSummary {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, query: GetReportsQuery): Promise<RevenueSummaryReturn> {
		const { endDate, period, startDate, unitId } = query;
		const now = new Date();
		const { since, until } = getReportDateRange(period, startDate, endDate, now);

		const agg = await this.prisma.order.aggregate({
			_count: { id: true },
			_sum: { total: true },
			where: {
				...(companyId ? { companyId } : {}),
				status: { in: COMPLETED },
				...(unitId ? { unitId } : {}),
				...(since || until ? { createdAt: { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } } : {}),
			},
		});

		const orderCount = agg._count.id;
		const totalRevenue = agg._sum.total ?? 0;
		const averageOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

		return { averageOrderValue, orderCount, totalRevenue };
	}
}
