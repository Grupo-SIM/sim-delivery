import type { PrismaInstance } from "@/shared/infra/sql";
import type { BestSellersReturn, GetReportsQuery } from "../dtos";
import { getReportDateRange } from "../utils/reportPeriod";

const COMPLETED = ["entregue", "retirado"];

export class GetBestSellers {
	constructor(private readonly prisma: PrismaInstance) {}

	/** `limit` defaults to the dashboard's top 10; pass `null` to rank every product (spreadsheet export). */
	async execute(
		companyId: string | null,
		query: GetReportsQuery,
		limit: number | null = 10,
	): Promise<BestSellersReturn> {
		const { endDate, period, startDate, unitId } = query;
		const now = new Date();
		const { since, until } = getReportDateRange(period, startDate, endDate, now);

		const rows = await this.prisma.orderItem.groupBy({
			_sum: { quantity: true, total: true },
			by: ["productId", "productName"],
			orderBy: { _sum: { quantity: "desc" } },
			...(limit === null ? {} : { take: limit }),
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

		return rows.map(r => ({
			productId: r.productId,
			productName: r.productName,
			totalQuantity: r._sum.quantity ?? 0,
			totalRevenue: r._sum.total ?? 0,
		}));
	}
}
