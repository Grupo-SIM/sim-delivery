import type { PrismaInstance } from "@/shared/infra/sql";
import type { DashboardAnalyticsReturn, GetDashboardAnalyticsQuery } from "../dtos";
import { getOrdersByPeriod } from "../utils/ordersByPeriod";
import { COMPLETED } from "../utils/orderStatus";
import { getDefaultReportGroupBy, getReportDateRange } from "../utils/reportPeriod";

export class GetDashboardAnalytics {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		query: GetDashboardAnalyticsQuery,
	): Promise<DashboardAnalyticsReturn> {
		const { endDate, groupBy: requestedGroupBy, period, startDate, unitId } = query;
		const now = new Date();
		const { since, until } = getReportDateRange(period, startDate, endDate, now);
		const groupBy = requestedGroupBy ?? getDefaultReportGroupBy(since, now);
		const orders = await this.prisma.order.findMany({
			select: {
				createdAt: true,
				deliveryFee: true,
				deliveryMethod: true,
				total: true,
				unitId: true,
			},
			where: {
				...(companyId ? { companyId } : {}),
				status: { in: COMPLETED },
				...(unitId ? { unitId } : {}),
				...(since || until
					? { createdAt: { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } }
					: {}),
			},
		});

		const ordersByPeriod = getOrdersByPeriod(orders, groupBy, since, now);

		const deliveryOrders = orders.filter(order => order.deliveryMethod === "delivery");
		const unitIds = [...new Set(deliveryOrders.map(order => order.unitId))];
		const units = await this.prisma.unit.findMany({
			select: {
				deliveryZones: { orderBy: { radiusKm: "asc" }, select: { fee: true, radiusKm: true } },
				id: true,
				name: true,
			},
			where: { id: { in: unitIds } },
		});
		const unitsById = new Map(units.map(unit => [unit.id, unit]));
		const deliveryRadiusPerformance = new Map<
			string,
			{
				deliveryFee: number;
				orderCount: number;
				radiusKm: number | null;
				totalRevenue: number;
				unitId: string;
				unitName: string;
			}
		>();

		for (const order of deliveryOrders) {
			const unit = unitsById.get(order.unitId);
			if (!unit) continue;
			const radiusKm = unit.deliveryZones.find(zone => zone.fee === order.deliveryFee)?.radiusKm ?? null;
			const key = `${order.unitId}:${radiusKm ?? "default"}:${order.deliveryFee}`;
			const row = deliveryRadiusPerformance.get(key) ?? {
				deliveryFee: order.deliveryFee,
				orderCount: 0,
				radiusKm,
				totalRevenue: 0,
				unitId: unit.id,
				unitName: unit.name,
			};

			row.orderCount += 1;
			row.totalRevenue += order.total;
			deliveryRadiusPerformance.set(key, row);
		}

		return {
			deliveryRadiusPerformance: [...deliveryRadiusPerformance.values()].sort(
				(a, b) => b.totalRevenue - a.totalRevenue,
			),
			groupBy,
			ordersByPeriod,
		};
	}
}
