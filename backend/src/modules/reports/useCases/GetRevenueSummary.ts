import type { PrismaInstance } from "@/shared/infra/sql";
import type { GetReportsQuery, RevenueSummaryReturn } from "../dtos";
import { COMPLETED } from "../utils/orderStatus";
import { getReportDateRange } from "../utils/reportPeriod";

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
				...(since || until
					? { createdAt: { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } }
					: {}),
			},
		});

		const orderCount = agg._count.id;
		const totalRevenue = agg._sum.total ?? 0;
		const averageOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;
		const items = await this.prisma.orderItem.findMany({
			select: { costCents: true, netRevenueCents: true, total: true },
			where: {
				order: {
					...(companyId ? { companyId } : {}),
					status: { in: COMPLETED },
					...(unitId ? { unitId } : {}),
					...(since || until
						? { createdAt: { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } }
						: {}),
				},
			},
		});
		const known = items.filter(item => item.costCents !== null);
		const knownCostCents = known.reduce((sum, item) => sum + item.costCents!, 0);
		const knownNetRevenueCents = known.reduce((sum, item) => sum + (item.netRevenueCents ?? item.total), 0);
		const unknownCostRevenueCents = items
			.filter(item => item.costCents === null)
			.reduce((sum, item) => sum + (item.netRevenueCents ?? item.total), 0);
		const grossProfitCents = knownNetRevenueCents - knownCostCents;
		const grossMarginPercent =
			knownNetRevenueCents > 0 ? (grossProfitCents / knownNetRevenueCents) * 100 : null;

		return {
			averageOrderValue,
			grossMarginPercent,
			grossProfitCents,
			knownCostCents,
			knownNetRevenueCents,
			orderCount,
			totalRevenue,
			unknownCostRevenueCents,
		};
	}
}
