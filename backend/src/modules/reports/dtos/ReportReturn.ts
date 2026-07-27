import { t } from "elysia";

export const RevenueSummaryReturn = t.Object({
	averageOrderValue: t.Integer(),
	grossProfitCents: t.Optional(t.Integer()),
	grossMarginPercent: t.Optional(t.Nullable(t.Number())),
	knownCostCents: t.Optional(t.Integer()),
	knownNetRevenueCents: t.Optional(t.Integer()),
	orderCount: t.Integer(),
	totalRevenue: t.Integer(),
	unknownCostRevenueCents: t.Optional(t.Integer()),
});
export type RevenueSummaryReturn = typeof RevenueSummaryReturn.static;

export const BestSellerItem = t.Object({
	productId: t.String(),
	productName: t.String(),
	grossProfitCents: t.Optional(t.Integer()),
	grossMarginPercent: t.Optional(t.Nullable(t.Number())),
	knownCostCents: t.Optional(t.Integer()),
	knownNetRevenueCents: t.Optional(t.Integer()),
	totalQuantity: t.Integer(),
	totalRevenue: t.Integer(),
	unknownCostRevenueCents: t.Optional(t.Integer()),
});
export type BestSellerItem = typeof BestSellerItem.static;

export const BestSellersReturn = t.Array(BestSellerItem);
export type BestSellersReturn = typeof BestSellersReturn.static;

export const OrdersByPeriodItem = t.Object({
	key: t.String(),
	label: t.String(),
	orderCount: t.Integer(),
});
export type OrdersByPeriodItem = typeof OrdersByPeriodItem.static;

export const DeliveryRadiusPerformanceItem = t.Object({
	deliveryFee: t.Integer(),
	orderCount: t.Integer(),
	radiusKm: t.Nullable(t.Number()),
	totalRevenue: t.Integer(),
	unitId: t.String(),
	unitName: t.String(),
});
export type DeliveryRadiusPerformanceItem = typeof DeliveryRadiusPerformanceItem.static;

export const DashboardAnalyticsReturn = t.Object({
	deliveryRadiusPerformance: t.Array(DeliveryRadiusPerformanceItem),
	groupBy: t.Union([
		t.Literal("hourOfDay"),
		t.Literal("dayOfWeek"),
		t.Literal("dayOfMonth"),
		t.Literal("month"),
		t.Literal("quarter"),
		t.Literal("year"),
	]),
	ordersByPeriod: t.Array(OrdersByPeriodItem),
});
export type DashboardAnalyticsReturn = typeof DashboardAnalyticsReturn.static;
