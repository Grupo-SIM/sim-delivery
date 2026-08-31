import type { PrismaInstance } from "@/shared/infra/sql";
import type { BestSellersReturn, GetReportsQuery } from "../dtos";
import { COMPLETED } from "../utils/orderStatus";
import { getReportDateRange } from "../utils/reportPeriod";

export class GetBestSellers {
	constructor(private readonly prisma: PrismaInstance) {}

	/** `limit` defaults to the dashboard's top 10; pass `null` to rank every product (spreadsheet export). */
	async execute(
		companyId: string | null,
		query: GetReportsQuery,
		limit: number | null = 10,
		permittedUnitIds?: string[],
	): Promise<BestSellersReturn> {
		const { endDate, period, startDate, unitId } = query;
		const now = new Date();
		const { since, until } = getReportDateRange(period, startDate, endDate, now);
		const unitFilter = unitId ? { unitId } : permittedUnitIds ? { unitId: { in: permittedUnitIds } } : {};

		const rows = await this.prisma.orderItem.groupBy({
			_sum: { costCents: true, netRevenueCents: true, quantity: true, total: true },
			by: ["productId", "productName"],
			orderBy: { _sum: { quantity: "desc" } },
			...(limit === null ? {} : { take: limit }),
			where: {
				order: {
					...(companyId ? { companyId } : {}),
					status: { in: COMPLETED },
					...unitFilter,
					...(since || until
						? { createdAt: { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } }
						: {}),
				},
			},
		});

		return rows.map(r => {
			const knownCostCents = r._sum.costCents ?? 0;
			const knownNetRevenueCents = r._sum.netRevenueCents ?? 0;
			const grossProfitCents = knownNetRevenueCents - knownCostCents;
			return {
				grossMarginPercent: knownNetRevenueCents > 0 ? (grossProfitCents / knownNetRevenueCents) * 100 : null,
				grossProfitCents,
				knownCostCents,
				knownNetRevenueCents,
				productId: r.productId,
				productName: r.productName,
				totalQuantity: r._sum.quantity ?? 0,
				totalRevenue: r._sum.total ?? 0,
				unknownCostRevenueCents: (r._sum.total ?? 0) - knownNetRevenueCents,
			};
		});
	}
}
