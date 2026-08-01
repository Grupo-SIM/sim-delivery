import type { PrismaInstance } from "@/shared/infra/sql";
import type { FinancialAnalyticsReturn, GetDashboardAnalyticsQuery } from "../dtos";
import { getOrdersByPeriod } from "../utils/ordersByPeriod";
import { getReportDateRange, type ReportGroupBy } from "../utils/reportPeriod";

const COMPLETED = ["entregue", "retirado"];

type Query = GetDashboardAnalyticsQuery;
interface FinancialOrder {
	cashbackCentsRedeemed: number;
	createdAt: Date;
	deliveryFee: number;
	deliveryMethod: string;
	discountCents: number;
	items: { costCents: number | null; netRevenueCents: number | null; total: number }[];
	payment: { confirmedAt: Date | null; method: string; status: string } | null;
	statusEvents: { createdAt: Date; status: string }[];
	total: number;
	updatedAt: Date;
}

function competenceDate(order: FinancialOrder) {
	if (order.payment?.confirmedAt) return order.payment.confirmedAt;
	const completion = order.statusEvents.findLast(event => COMPLETED.includes(event.status));
	return completion?.createdAt ?? order.updatedAt;
}

function amountChange(current: number, previous: number) {
	if (previous === 0) return null;
	return ((current - previous) / previous) * 100;
}

function emptySummary(): {
	averageOrderValue: number;
	cashbackRedeemedCents: number;
	deliveryFeeCents: number;
	discountCents: number;
	grossMarginPercent: number | null;
	grossProfitCents: number;
	grossRevenueCents: number;
	knownCostCents: number;
	knownItemNetRevenueCents: number;
	netRevenueCents: number;
	orderCount: number;
	unknownCostRevenueCents: number;
} {
	return {
		averageOrderValue: 0,
		cashbackRedeemedCents: 0,
		deliveryFeeCents: 0,
		discountCents: 0,
		grossMarginPercent: null,
		grossProfitCents: 0,
		grossRevenueCents: 0,
		knownCostCents: 0,
		knownItemNetRevenueCents: 0,
		netRevenueCents: 0,
		orderCount: 0,
		unknownCostRevenueCents: 0,
	};
}

function summarize(orders: FinancialOrder[]) {
	const summary = emptySummary();
	for (const order of orders) {
		summary.orderCount += 1;
		summary.netRevenueCents += order.total;
		summary.deliveryFeeCents += order.deliveryFee;
		summary.discountCents += order.discountCents;
		summary.cashbackRedeemedCents += order.cashbackCentsRedeemed;
		summary.grossRevenueCents += order.total + order.discountCents + order.cashbackCentsRedeemed;
		for (const item of order.items) {
			const revenue = item.netRevenueCents ?? item.total;
			if (item.costCents === null) summary.unknownCostRevenueCents += revenue;
			else {
				summary.knownCostCents += item.costCents;
				summary.knownItemNetRevenueCents += revenue;
			}
		}
	}
	summary.averageOrderValue = summary.orderCount
		? Math.round(summary.netRevenueCents / summary.orderCount)
		: 0;
	summary.grossProfitCents = summary.knownItemNetRevenueCents - summary.knownCostCents;
	summary.grossMarginPercent = summary.knownItemNetRevenueCents
		? (summary.grossProfitCents / summary.knownItemNetRevenueCents) * 100
		: null;
	return summary;
}

function financialTrendKey(date: Date, groupBy: ReportGroupBy): string {
	if (groupBy === "hourOfDay") return String(date.getHours());
	if (groupBy === "dayOfWeek") return String((date.getDay() + 6) % 7);
	if (groupBy === "dayOfMonth") return String(date.getDate());
	if (groupBy === "month") return String(date.getMonth());
	if (groupBy === "quarter") return String(Math.floor(date.getMonth() / 3));
	return String(date.getFullYear());
}

export class GetFinancialAnalytics {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		query: Query,
		permittedUnitIds?: string[],
	): Promise<FinancialAnalyticsReturn> {
		const now = new Date();
		const { since, until } = getReportDateRange(query.period, query.startDate, query.endDate, now);
		const duration = since && until ? until.getTime() - since.getTime() : undefined;
		const previousSince = since && duration ? new Date(since.getTime() - duration) : undefined;
		const previousUntil = since;
		const groupBy = query.groupBy ?? "dayOfMonth";
		const unitIds = permittedUnitIds?.length ? permittedUnitIds : undefined;
		if (query.unitId && unitIds && !unitIds.includes(query.unitId))
			return this.empty(groupBy, since, now, until);
		const where = {
			...(companyId ? { companyId } : {}),
			status: { in: COMPLETED },
			...(query.unitId ? { unitId: query.unitId } : unitIds ? { unitId: { in: unitIds } } : {}),
		};
		const orders = await this.prisma.order.findMany({
			include: { items: true, payment: true, statusEvents: { orderBy: { createdAt: "asc" } } },
			where,
		});
		const dated = orders.map(order => ({ ...order, competenceAt: competenceDate(order) }));
		const current = dated.filter(
			order => (!since || order.competenceAt >= since) && (!until || order.competenceAt < until),
		);
		const previous = dated.filter(
			order =>
				previousSince &&
				previousUntil &&
				order.competenceAt >= previousSince &&
				order.competenceAt < previousUntil,
		);
		const summary = summarize(current);
		const previousSummary = summarize(previous);
		const trend = new Map(
			getOrdersByPeriod([], groupBy, since, now, until).map(bucket => [
				bucket.key,
				{ grossProfitCents: 0, label: bucket.label, netRevenueCents: 0, orderCount: 0 },
			]),
		);
		for (const order of current) {
			const key = financialTrendKey(order.competenceAt, groupBy);
			const row = trend.get(key);
			if (!row) continue;
			const orderSummary = summarize([order]);
			row.orderCount += 1;
			row.netRevenueCents += order.total;
			row.grossProfitCents += orderSummary.grossProfitCents;
		}
		const byPayment = new Map<string, { method: string; netRevenueCents: number; orderCount: number }>();
		const byDelivery = new Map<string, { method: string; netRevenueCents: number; orderCount: number }>();
		for (const order of current) {
			for (const [map, method] of [
				[byPayment, order.payment?.method ?? "unreported"],
				[byDelivery, order.deliveryMethod],
			] as const) {
				const row = map.get(method) ?? { method, netRevenueCents: 0, orderCount: 0 };
				row.orderCount += 1;
				row.netRevenueCents += order.total;
				map.set(method, row);
			}
		}
		return {
			comparison: {
				averageOrderValuePercent: amountChange(summary.averageOrderValue, previousSummary.averageOrderValue),
				grossMarginPercent:
					summary.grossMarginPercent === null || previousSummary.grossMarginPercent === null
						? null
						: summary.grossMarginPercent - previousSummary.grossMarginPercent,
				grossProfitPercent: amountChange(summary.grossProfitCents, previousSummary.grossProfitCents),
				netRevenuePercent: amountChange(summary.netRevenueCents, previousSummary.netRevenueCents),
				orderCountPercent: amountChange(summary.orderCount, previousSummary.orderCount),
			},
			distribution: { delivery: [...byDelivery.values()], payment: [...byPayment.values()] },
			groupBy,
			summary,
			trend: [...trend.values()],
		};
	}

	private empty(
		groupBy: ReportGroupBy,
		since: Date | undefined,
		now: Date,
		until?: Date,
	): FinancialAnalyticsReturn {
		return {
			comparison: {
				averageOrderValuePercent: null,
				grossMarginPercent: null,
				grossProfitPercent: null,
				netRevenuePercent: null,
				orderCountPercent: null,
			},
			distribution: { delivery: [], payment: [] },
			groupBy,
			summary: emptySummary(),
			trend: getOrdersByPeriod([], groupBy, since, now, until).map(bucket => ({
				grossProfitCents: 0,
				label: bucket.label,
				netRevenueCents: 0,
				orderCount: 0,
			})),
		};
	}
}
