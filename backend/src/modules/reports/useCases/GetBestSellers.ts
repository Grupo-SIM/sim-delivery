import type { PrismaInstance } from "@/shared/infra/sql";
import type { BestSellersReturn, GetReportsQuery } from "../dtos";
import { getReportDateRange } from "../utils/reportPeriod";

const COMPLETED = ["entregue", "retirado"];

export class GetBestSellers {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, query: GetReportsQuery): Promise<BestSellersReturn> {
		const { endDate, period, startDate, unitId } = query;
		const now = new Date();
		const { since, until } = getReportDateRange(period, startDate, endDate, now);

		const rows = await this.prisma.orderItem.groupBy({
			_sum: { quantity: true, total: true },
			by: ["productId", "productName"],
			orderBy: { _sum: { quantity: "desc" } },
			take: 10,
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
