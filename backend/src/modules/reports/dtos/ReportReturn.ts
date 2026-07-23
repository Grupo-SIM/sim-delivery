import { t } from "elysia";

export const RevenueSummaryReturn = t.Object({
	averageOrderValue: t.Integer(),
	orderCount: t.Integer(),
	totalRevenue: t.Integer(),
});
export type RevenueSummaryReturn = typeof RevenueSummaryReturn.static;

export const BestSellerItem = t.Object({
	productId: t.String(),
	productName: t.String(),
	totalQuantity: t.Integer(),
	totalRevenue: t.Integer(),
});
export type BestSellerItem = typeof BestSellerItem.static;

export const BestSellersReturn = t.Array(BestSellerItem);
export type BestSellersReturn = typeof BestSellersReturn.static;

export const OrdersByHourItem = t.Object({
	hour: t.Integer({ minimum: 0, maximum: 23 }),
	orderCount: t.Integer(),
});
export type OrdersByHourItem = typeof OrdersByHourItem.static;

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
	ordersByHour: t.Array(OrdersByHourItem),
});
export type DashboardAnalyticsReturn = typeof DashboardAnalyticsReturn.static;
