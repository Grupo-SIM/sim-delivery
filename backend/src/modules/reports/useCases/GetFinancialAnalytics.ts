import type { PrismaInstance } from "@/shared/infra/sql";
import type { FinancialAnalyticsReturn, GetDashboardAnalyticsQuery } from "../dtos";
import { merchantAmount } from "../utils/merchantAmount";
import { getOrdersByPeriod } from "../utils/ordersByPeriod";
import { CANCELLED, COMPLETED } from "../utils/orderStatus";
import { getReportDateRange, type ReportGroupBy } from "../utils/reportPeriod";

type Query = GetDashboardAnalyticsQuery;
interface FinancialOrder {
	cashbackCentsRedeemed: number;
	createdAt: Date;
	deliveryFee: number;
	deliveryMethod: string;
	discountCents: number;
	feeTotalCents: number;
	items: { costCents: number | null; netRevenueCents: number | null; total: number }[];
	payment: { confirmedAt: Date | null; coproductionCents?: number; method: string; status: string } | null;
	refundedCents: number;
	statusEvents: { createdAt: Date; status: string }[];
	total: number;
	updatedAt: Date;
}

interface CancelledOrder {
	feeTotalCents: number;
	items: { costCents: number | null }[];
	payment: { coproductionCents?: number; status: string } | null;
	refundedCents: number;
	statusEvents: { createdAt: Date; status: string }[];
	total: number;
	updatedAt: Date;
}

function competenceDate(order: FinancialOrder) {
	if (order.payment?.confirmedAt) return order.payment.confirmedAt;
	const completion = order.statusEvents.findLast(event => COMPLETED.includes(event.status));
	return completion?.createdAt ?? order.updatedAt;
}

/** The event right before the one that cancelled the order — "awaiting_payment" if there is none. */
function cancellationStage(order: CancelledOrder): { at: Date; stage: string } {
	const events = order.statusEvents;
	const cancelIndex = events.findLastIndex(event => event.status === CANCELLED);
	const previous = cancelIndex > 0 ? events[cancelIndex - 1] : undefined;
	const cancelledAt = events[cancelIndex]?.createdAt ?? order.updatedAt;
	return { at: cancelledAt, stage: previous?.status ?? "awaiting_payment" };
}

function amountChange(current: number, previous: number) {
	if (previous === 0) return null;
	return ((current - previous) / previous) * 100;
}

function merchantRefund(order: { feeTotalCents: number; payment?: { coproductionCents?: number | null } | null; refundedCents: number; total: number }) {
	return order.total > 0 ? Math.round((order.refundedCents * merchantAmount(order)) / order.total) : 0;
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
	refundedCents: number;
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
		refundedCents: 0,
		unknownCostRevenueCents: 0,
	};
}

function emptyCancellation(): {
	averageCanceledTicket: number;
	byStage: { lostRevenueCents: number; orderCount: number; stage: string }[];
	cancelRatePercent: number;
	canceledOrderCount: number;
	lostRevenueCents: number;
	pendingRefundCents: number;
	refundedCents: number;
	refundedOrderCount: number;
	wastedCostCents: number;
} {
	return {
		averageCanceledTicket: 0,
		byStage: [],
		cancelRatePercent: 0,
		canceledOrderCount: 0,
		lostRevenueCents: 0,
		pendingRefundCents: 0,
		refundedCents: 0,
		refundedOrderCount: 0,
		wastedCostCents: 0,
	};
}

function summarize(orders: FinancialOrder[]) {
	const summary = emptySummary();
	for (const order of orders) {
		summary.orderCount += 1;
		summary.netRevenueCents += merchantAmount(order);
		summary.deliveryFeeCents += order.deliveryFee;
		summary.discountCents += order.discountCents;
		summary.cashbackRedeemedCents += order.cashbackCentsRedeemed;
		summary.grossRevenueCents += merchantAmount(order) + order.discountCents + order.cashbackCentsRedeemed;
		summary.refundedCents += merchantRefund(order);
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
	// Refunds reduce what was actually collected; the cost side already happened, so a refund is
	// treated as a straight reduction of profit rather than being re-attributed across items.
	summary.netRevenueCents -= summary.refundedCents;
	summary.grossProfitCents = summary.knownItemNetRevenueCents - summary.knownCostCents - summary.refundedCents;
	summary.grossMarginPercent = summary.knownItemNetRevenueCents
		? (summary.grossProfitCents / summary.knownItemNetRevenueCents) * 100
		: null;
	return summary;
}

function summarizeCancellations(orders: CancelledOrder[]) {
	const cancellation = emptyCancellation();
	const byStage = new Map<string, { lostRevenueCents: number; orderCount: number }>();
	for (const order of orders) {
		cancellation.canceledOrderCount += 1;
		cancellation.lostRevenueCents += merchantAmount(order);
		cancellation.refundedCents += merchantRefund(order);
		if (order.refundedCents > 0) cancellation.refundedOrderCount += 1;
		if (order.payment?.status === "confirmed" && order.refundedCents === 0)
			cancellation.pendingRefundCents += merchantAmount(order);
		for (const item of order.items) cancellation.wastedCostCents += item.costCents ?? 0;

		const { stage } = cancellationStage(order);
		const row = byStage.get(stage) ?? { lostRevenueCents: 0, orderCount: 0 };
		row.orderCount += 1;
		row.lostRevenueCents += merchantAmount(order);
		byStage.set(stage, row);
	}
	cancellation.averageCanceledTicket = cancellation.canceledOrderCount
		? Math.round(cancellation.lostRevenueCents / cancellation.canceledOrderCount)
		: 0;
	cancellation.byStage = [...byStage.entries()]
		.map(([stage, row]) => ({ stage, ...row }))
		.sort((a, b) => b.orderCount - a.orderCount);
	return cancellation;
}

function summarizePaymentAbandonment(orders: CancelledOrder[]) {
	const abandonedValueCents = orders.reduce((total, order) => total + merchantAmount(order), 0);
	return {
		abandonedOrderCount: orders.length,
		abandonedValueCents,
		averageAbandonedTicket: orders.length ? Math.round(abandonedValueCents / orders.length) : 0,
	};
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
		const unitIds = permittedUnitIds;
		if (query.unitId && unitIds && !unitIds.includes(query.unitId))
			return this.empty(groupBy, since, now, until);
		const unitFilter = query.unitId ? { unitId: query.unitId } : unitIds ? { unitId: { in: unitIds } } : {};
		// Competence can differ from creation date, so the window is padded on both ends; the fine
		// filter by competenceAt below still enforces the exact period.
		const paddingMs = 7 * 24 * 60 * 60 * 1000;
		const createdAtFilter =
			previousSince || until
				? {
						createdAt: {
							...(previousSince ? { gte: new Date(previousSince.getTime() - paddingMs) } : {}),
							...(until ? { lt: new Date(until.getTime() + paddingMs) } : {}),
						},
					}
				: {};

		const orders = await this.prisma.order.findMany({
			include: { items: true, payment: true, statusEvents: { orderBy: { createdAt: "asc" } } },
			where: {
				...(companyId ? { companyId } : {}),
				status: { in: COMPLETED },
				...unitFilter,
				...createdAtFilter,
			},
		});
		const cancelledOrders = await this.prisma.order.findMany({
			include: {
				items: { select: { costCents: true } },
				payment: { select: { coproductionCents: true, status: true } },
				statusEvents: { orderBy: { createdAt: "asc" } },
			},
			where: {
				...(companyId ? { companyId } : {}),
				status: CANCELLED,
				...unitFilter,
				...createdAtFilter,
			},
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
		const currentAllCancelled = cancelledOrders.filter(order => {
			const { at } = cancellationStage(order);
			return (!since || at >= since) && (!until || at < until);
		});
		const previousAllCancelled = cancelledOrders.filter(order => {
			const { at } = cancellationStage(order);
			return previousSince && previousUntil && at >= previousSince && at < previousUntil;
		});
		const currentCancelled = currentAllCancelled.filter(order => order.payment?.status === "confirmed");
		const previousCancelled = previousAllCancelled.filter(order => order.payment?.status === "confirmed");
		const currentAbandoned = currentAllCancelled.filter(order => order.payment?.status !== "confirmed");

		const summary = summarize(current);
		const previousSummary = summarize(previous);
		const cancellation = summarizeCancellations(currentCancelled);
		const previousCancellation = summarizeCancellations(previousCancelled);
		const paymentAbandonment = summarizePaymentAbandonment(currentAbandoned);
		cancellation.cancelRatePercent = cancellation.canceledOrderCount + summary.orderCount
			? (cancellation.canceledOrderCount / (cancellation.canceledOrderCount + summary.orderCount)) * 100
			: 0;
		previousCancellation.cancelRatePercent =
			previousCancellation.canceledOrderCount + previousSummary.orderCount
				? (previousCancellation.canceledOrderCount /
						(previousCancellation.canceledOrderCount + previousSummary.orderCount)) *
					100
				: 0;

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
			row.netRevenueCents += merchantAmount(order) - merchantRefund(order);
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
				row.netRevenueCents += merchantAmount(order);
				map.set(method, row);
			}
		}
		return {
			cancellation,
			comparison: {
				averageOrderValuePercent: amountChange(summary.averageOrderValue, previousSummary.averageOrderValue),
				cancelRatePercentPoints:
					previous.length + previousCancelled.length === 0
						? null
						: cancellation.cancelRatePercent - previousCancellation.cancelRatePercent,
				grossMarginPercent:
					summary.grossMarginPercent === null || previousSummary.grossMarginPercent === null
						? null
						: summary.grossMarginPercent - previousSummary.grossMarginPercent,
				grossProfitPercent: amountChange(summary.grossProfitCents, previousSummary.grossProfitCents),
				lostRevenuePercent: amountChange(cancellation.lostRevenueCents, previousCancellation.lostRevenueCents),
				netRevenuePercent: amountChange(summary.netRevenueCents, previousSummary.netRevenueCents),
				orderCountPercent: amountChange(summary.orderCount, previousSummary.orderCount),
				refundedPercent: amountChange(summary.refundedCents, previousSummary.refundedCents),
			},
			distribution: { delivery: [...byDelivery.values()], payment: [...byPayment.values()] },
			groupBy,
			paymentAbandonment,
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
			cancellation: emptyCancellation(),
			comparison: {
				averageOrderValuePercent: null,
				cancelRatePercentPoints: null,
				grossMarginPercent: null,
				grossProfitPercent: null,
				lostRevenuePercent: null,
				netRevenuePercent: null,
				orderCountPercent: null,
				refundedPercent: null,
			},
			distribution: { delivery: [], payment: [] },
			groupBy,
			paymentAbandonment: summarizePaymentAbandonment([]),
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
