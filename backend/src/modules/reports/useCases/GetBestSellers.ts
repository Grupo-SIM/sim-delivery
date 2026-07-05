import { DomainError } from "@/shared/errors";
import { UserErrors } from "@/modules/users/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { GetReportsQuery, BestSellersReturn } from "../dtos";

const COMPLETED = ["entregue", "retirado"];

function periodStart(period?: string): Date | undefined {
	const now = new Date();
	if (period === "today") {
		return new Date(now.getFullYear(), now.getMonth(), now.getDate());
	}
	if (period === "week") {
		const d = new Date(now);
		d.setDate(d.getDate() - 6);
		d.setHours(0, 0, 0, 0);
		return d;
	}
	if (period === "month") {
		return new Date(now.getFullYear(), now.getMonth(), 1);
	}
	return undefined;
}

export class GetBestSellers {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, query: GetReportsQuery): Promise<BestSellersReturn> {
		if (!companyId) throw new DomainError(UserErrors.FORBIDDEN);
		const { period, unitId } = query;
		const since = periodStart(period);

		const rows = await this.prisma.orderItem.groupBy({
			by: ["productId", "productName"],
			_sum: { quantity: true, total: true },
			orderBy: { _sum: { quantity: "desc" } },
			take: 10,
			where: {
				order: {
					companyId,
					status: { in: COMPLETED },
					...(unitId ? { unitId } : {}),
					...(since ? { createdAt: { gte: since } } : {}),
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
