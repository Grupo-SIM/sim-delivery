import type { PrismaInstance } from "@/shared/infra/sql";
import type { DashboardAnalyticsReturn, GetReportsQuery } from "../dtos";

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

export class GetDashboardAnalytics {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, query: GetReportsQuery): Promise<DashboardAnalyticsReturn> {
		const { period, unitId } = query;
		const since = periodStart(period);
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
				...(since ? { createdAt: { gte: since } } : {}),
			},
		});

		const ordersByHour = Array.from({ length: 24 }, (_, hour) => ({ hour, orderCount: 0 }));
		for (const order of orders) {
			ordersByHour[order.createdAt.getHours()].orderCount += 1;
		}

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
			{ deliveryFee: number; orderCount: number; radiusKm: number | null; totalRevenue: number; unitId: string; unitName: string }
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
			deliveryRadiusPerformance: [...deliveryRadiusPerformance.values()].sort((a, b) => b.totalRevenue - a.totalRevenue),
			ordersByHour,
		};
	}
}
