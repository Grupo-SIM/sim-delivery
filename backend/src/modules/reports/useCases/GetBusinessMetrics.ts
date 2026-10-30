import type { PrismaInstance } from "@/shared/infra/sql";
import type { BusinessMetricsReturn, GetDashboardAnalyticsQuery } from "../dtos";
import { CANCELLED, COMPLETED } from "../utils/orderStatus";
import { getReportDateRange } from "../utils/reportPeriod";
import { merchantAmount } from "../utils/merchantAmount";

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => String(hour));
const WEEKDAY_LABELS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

interface MetricsOrder {
	companyId: string;
	couponId: string | null;
	coupon: { code: string; type: string } | null;
	createdAt: Date;
	customerId: string;
	deliveryMethod: string;
	discountCents: number;
	feeTotalCents: number;
	payment: { coproductionCents: number } | null;
	cashbackCentsRedeemed: number;
	loyaltyPointsRedeemed: number;
	items: { costCents: number | null; netRevenueCents: number | null; total: number }[];
	statusEvents: { createdAt: Date; status: string }[];
	status: string;
	total: number;
	unitId: string;
	unit: { name: string };
}

function minutesBetween(from?: Date, to?: Date): number | undefined {
	if (!from || !to) return undefined;
	return (to.getTime() - from.getTime()) / 60_000;
}

function average(values: number[]): number | null {
	if (values.length === 0) return null;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function eventAt(order: MetricsOrder, status: string): Date | undefined {
	return order.statusEvents.find(event => event.status === status)?.createdAt;
}

/**
 * Business-facing metrics that don't fit the revenue/margin summary: repeat customers,
 * discount cost, operational timing/peaks, and a per-unit comparison. Uses order.createdAt
 * (not competence date) — these are secondary indicators where that precision doesn't matter.
 */
export class GetBusinessMetrics {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		query: GetDashboardAnalyticsQuery,
		permittedUnitIds?: string[],
	): Promise<BusinessMetricsReturn> {
		const now = new Date();
		const { since, until } = getReportDateRange(query.period, query.startDate, query.endDate, now);
		const unitFilter = query.unitId ? { unitId: query.unitId } : permittedUnitIds ? { unitId: { in: permittedUnitIds } } : {};
		const where = {
			...(companyId ? { companyId } : {}),
			...unitFilter,
			...(since || until
				? { createdAt: { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } }
				: {}),
		};

		const orders = (await this.prisma.order.findMany({
			include: {
				coupon: { select: { code: true, type: true } },
				items: { select: { costCents: true, netRevenueCents: true, total: true } },
				payment: { select: { coproductionCents: true } },
				statusEvents: { orderBy: { createdAt: "asc" } },
				unit: { select: { name: true } },
			},
			where,
		})) as unknown as MetricsOrder[];

		const completed = orders.filter(order => COMPLETED.includes(order.status));
		const cancelled = orders.filter(order => order.status === CANCELLED);

		return {
			customers: await this.customerMetrics(companyId, completed),
			discounts: this.discountMetrics(completed),
			operations: this.operationsMetrics(orders, completed),
			units: this.unitMetrics(completed, cancelled),
		};
	}

	private async customerMetrics(
		companyId: string | null,
		completed: MetricsOrder[],
	): Promise<BusinessMetricsReturn["customers"]> {
		const customerIds = [...new Set(completed.map(order => order.customerId))];
		if (customerIds.length === 0) {
			return { newCustomers: 0, ordersPerCustomer: 0, repeatRatePercent: 0, returningCustomers: 0, revenuePerCustomer: 0 };
		}

		const firstOrders = await this.prisma.order.groupBy({
			_min: { createdAt: true },
			by: ["customerId"],
			where: {
				...(companyId ? { companyId } : {}),
				customerId: { in: customerIds },
				status: { in: COMPLETED },
			},
		});
		const firstOrderAt = new Map(firstOrders.map(row => [row.customerId, row._min.createdAt]));

		const periodStartByCustomer = new Map<string, Date>();
		for (const order of completed) {
			const current = periodStartByCustomer.get(order.customerId);
			if (!current || order.createdAt < current) periodStartByCustomer.set(order.customerId, order.createdAt);
		}

		let newCustomers = 0;
		for (const customerId of customerIds) {
			const globalFirst = firstOrderAt.get(customerId);
			const periodFirst = periodStartByCustomer.get(customerId);
			if (globalFirst && periodFirst && globalFirst.getTime() === periodFirst.getTime()) newCustomers += 1;
		}
		const returningCustomers = customerIds.length - newCustomers;
		const totalRevenue = completed.reduce((sum, order) => sum + merchantAmount(order), 0);

		return {
			newCustomers,
			ordersPerCustomer: completed.length / customerIds.length,
			repeatRatePercent: (returningCustomers / customerIds.length) * 100,
			returningCustomers,
			revenuePerCustomer: Math.round(totalRevenue / customerIds.length),
		};
	}

	private discountMetrics(completed: MetricsOrder[]): BusinessMetricsReturn["discounts"] {
		let discountCents = 0;
		let cashbackRedeemedCents = 0;
		let loyaltyPointsRedeemed = 0;
		let grossRevenueCents = 0;
		let couponOrderCount = 0;
		const byCoupon = new Map<
			string,
			{ code: string; discountCents: number; orderCount: number; revenueCents: number; type: string }
		>();

		for (const order of completed) {
			discountCents += order.discountCents;
			cashbackRedeemedCents += order.cashbackCentsRedeemed;
			loyaltyPointsRedeemed += order.loyaltyPointsRedeemed;
			grossRevenueCents += merchantAmount(order) + order.discountCents + order.cashbackCentsRedeemed;
			if (order.couponId && order.coupon) {
				couponOrderCount += 1;
				const row = byCoupon.get(order.couponId) ?? {
					code: order.coupon.code,
					discountCents: 0,
					orderCount: 0,
					revenueCents: 0,
					type: order.coupon.type,
				};
				row.orderCount += 1;
				row.discountCents += order.discountCents;
				row.revenueCents += merchantAmount(order);
				byCoupon.set(order.couponId, row);
			}
		}

		return {
			cashbackRedeemedCents,
			couponOrderCount,
			discountCents,
			discountShareOfGrossPercent: grossRevenueCents ? (discountCents / grossRevenueCents) * 100 : 0,
			loyaltyPointsRedeemed,
			topCoupons: [...byCoupon.values()].sort((a, b) => b.orderCount - a.orderCount).slice(0, 5),
		};
	}

	private operationsMetrics(
		orders: MetricsOrder[],
		completed: MetricsOrder[],
	): BusinessMetricsReturn["operations"] {
		const prepMinutes: number[] = [];
		const deliveryMinutes: number[] = [];
		const fulfillmentMinutes: number[] = [];
		const byHour = new Map<string, { orderCount: number; revenueCents: number }>();
		const byWeekday = new Map<string, { orderCount: number; revenueCents: number }>();

		for (const order of completed) {
			const prep = minutesBetween(eventAt(order, "em_preparo"), eventAt(order, "pronto"));
			if (prep !== undefined) prepMinutes.push(prep);
			if (order.deliveryMethod === "delivery") {
				const delivery = minutesBetween(eventAt(order, "saiu_para_entrega"), eventAt(order, "entregue"));
				if (delivery !== undefined) deliveryMinutes.push(delivery);
			}
			const fulfillment = minutesBetween(eventAt(order, "recebido"), eventAt(order, "entregue"));
			if (fulfillment !== undefined) fulfillmentMinutes.push(fulfillment);

			const hourKey = String(order.createdAt.getHours());
			const hourRow = byHour.get(hourKey) ?? { orderCount: 0, revenueCents: 0 };
			hourRow.orderCount += 1;
			hourRow.revenueCents += merchantAmount(order);
			byHour.set(hourKey, hourRow);

			const weekdayKey = String((order.createdAt.getDay() + 6) % 7);
			const weekdayRow = byWeekday.get(weekdayKey) ?? { orderCount: 0, revenueCents: 0 };
			weekdayRow.orderCount += 1;
			weekdayRow.revenueCents += merchantAmount(order);
			byWeekday.set(weekdayKey, weekdayRow);
		}

		const withProblem = orders.filter(order => order.statusEvents.some(event => event.status === "problema"));

		return {
			averageDeliveryMinutes: average(deliveryMinutes),
			averageFulfillmentMinutes: average(fulfillmentMinutes),
			averagePrepMinutes: average(prepMinutes),
			peaks: {
				byDayOfWeek: WEEKDAY_LABELS.map((label, index) => ({
					key: String(index),
					label,
					orderCount: byWeekday.get(String(index))?.orderCount ?? 0,
					revenueCents: byWeekday.get(String(index))?.revenueCents ?? 0,
				})),
				byHourOfDay: HOUR_LABELS.map(label => ({
					key: label,
					label,
					orderCount: byHour.get(label)?.orderCount ?? 0,
					revenueCents: byHour.get(label)?.revenueCents ?? 0,
				})),
			},
			problemRatePercent: orders.length ? (withProblem.length / orders.length) * 100 : 0,
		};
	}

	private unitMetrics(completed: MetricsOrder[], cancelled: MetricsOrder[]): BusinessMetricsReturn["units"] {
		const byUnit = new Map<
			string,
			{
				canceledOrderCount: number;
				knownCostCents: number;
				knownNetRevenueCents: number;
				netRevenueCents: number;
				orderCount: number;
				unitId: string;
				unitName: string;
			}
		>();

		for (const order of completed) {
			const row = byUnit.get(order.unitId) ?? {
				canceledOrderCount: 0,
				knownCostCents: 0,
				knownNetRevenueCents: 0,
				netRevenueCents: 0,
				orderCount: 0,
				unitId: order.unitId,
				unitName: order.unit.name,
			};
			row.orderCount += 1;
			row.netRevenueCents += merchantAmount(order);
			for (const item of order.items) {
				if (item.costCents === null) continue;
				row.knownCostCents += item.costCents;
				row.knownNetRevenueCents += item.netRevenueCents ?? item.total;
			}
			byUnit.set(order.unitId, row);
		}
		for (const order of cancelled) {
			const row = byUnit.get(order.unitId) ?? {
				canceledOrderCount: 0,
				knownCostCents: 0,
				knownNetRevenueCents: 0,
				netRevenueCents: 0,
				orderCount: 0,
				unitId: order.unitId,
				unitName: order.unit.name,
			};
			row.canceledOrderCount += 1;
			byUnit.set(order.unitId, row);
		}

		return [...byUnit.values()]
			.map(row => {
				const grossProfitCents = row.knownNetRevenueCents - row.knownCostCents;
				return {
					averageOrderValue: row.orderCount ? Math.round(row.netRevenueCents / row.orderCount) : 0,
					cancelRatePercent:
						row.orderCount + row.canceledOrderCount
							? (row.canceledOrderCount / (row.orderCount + row.canceledOrderCount)) * 100
							: 0,
					canceledOrderCount: row.canceledOrderCount,
					grossMarginPercent: row.knownNetRevenueCents
						? (grossProfitCents / row.knownNetRevenueCents) * 100
						: null,
					grossProfitCents,
					knownCostCents: row.knownCostCents,
					netRevenueCents: row.netRevenueCents,
					orderCount: row.orderCount,
					unitId: row.unitId,
					unitName: row.unitName,
				};
			})
			.sort((a, b) => b.netRevenueCents - a.netRevenueCents);
	}
}
