import { DomainError } from "@/shared/errors";
import { UserErrors } from "@/modules/users/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { GetReportsQuery, RevenueSummaryReturn } from "../dtos";

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

export class GetRevenueSummary {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, query: GetReportsQuery): Promise<RevenueSummaryReturn> {
		if (!companyId) throw new DomainError(UserErrors.FORBIDDEN);
		const { period, unitId } = query;
		const since = periodStart(period);

		const agg = await this.prisma.order.aggregate({
			_count: { id: true },
			_sum: { total: true },
			where: {
				companyId,
				status: { in: COMPLETED },
				...(unitId ? { unitId } : {}),
				...(since ? { createdAt: { gte: since } } : {}),
			},
		});

		const orderCount = agg._count.id;
		const totalRevenue = agg._sum.total ?? 0;
		const averageOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

		return { averageOrderValue, orderCount, totalRevenue };
	}
}
