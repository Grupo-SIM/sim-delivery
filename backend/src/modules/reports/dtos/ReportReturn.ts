import { t } from "elysia";

export const RevenueSummaryReturn = t.Object({
	averageOrderValue: t.Integer(),
	grossMarginPercent: t.Optional(t.Nullable(t.Number())),
	grossProfitCents: t.Optional(t.Integer()),
	knownCostCents: t.Optional(t.Integer()),
	knownNetRevenueCents: t.Optional(t.Integer()),
	orderCount: t.Integer(),
	totalRevenue: t.Integer(),
	unknownCostRevenueCents: t.Optional(t.Integer()),
});
export type RevenueSummaryReturn = typeof RevenueSummaryReturn.static;

export const BestSellerItem = t.Object({
	grossMarginPercent: t.Optional(t.Nullable(t.Number())),
	grossProfitCents: t.Optional(t.Integer()),
	knownCostCents: t.Optional(t.Integer()),
	knownNetRevenueCents: t.Optional(t.Integer()),
	productId: t.String(),
	productName: t.String(),
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

const FinancialSummary = t.Object({
	averageOrderValue: t.Integer(),
	cashbackRedeemedCents: t.Integer(),
	deliveryFeeCents: t.Integer(),
	discountCents: t.Integer(),
	grossMarginPercent: t.Nullable(t.Number()),
	grossProfitCents: t.Integer(),
	grossRevenueCents: t.Integer(),
	knownCostCents: t.Integer(),
	knownItemNetRevenueCents: t.Integer(),
	netRevenueCents: t.Integer(),
	orderCount: t.Integer(),
	/** Cents refunded on completed orders in the period; already subtracted from netRevenueCents/grossProfitCents. */
	refundedCents: t.Integer(),
	unknownCostRevenueCents: t.Integer(),
});

const FinancialDistributionItem = t.Object({
	method: t.String(),
	netRevenueCents: t.Integer(),
	orderCount: t.Integer(),
});
const FinancialTrendItem = t.Object({
	grossProfitCents: t.Integer(),
	label: t.String(),
	netRevenueCents: t.Integer(),
	orderCount: t.Integer(),
});

const CancellationByStageItem = t.Object({
	lostRevenueCents: t.Integer(),
	orderCount: t.Integer(),
	/** Status the order was in right before being cancelled; "awaiting_payment" if it never left it. */
	stage: t.String(),
});

const CancellationSummary = t.Object({
	averageCanceledTicket: t.Integer(),
	byStage: t.Array(CancellationByStageItem),
	cancelRatePercent: t.Number(),
	canceledOrderCount: t.Integer(),
	lostRevenueCents: t.Integer(),
	/** Cancelled, paid orders with no refund registered yet. */
	pendingRefundCents: t.Integer(),
	refundedCents: t.Integer(),
	refundedOrderCount: t.Integer(),
	/** Cost of reservations already consumed before cancellation — real ingredient waste. */
	wastedCostCents: t.Integer(),
});

const PaymentAbandonmentSummary = t.Object({
	abandonedOrderCount: t.Integer(),
	abandonedValueCents: t.Integer(),
	averageAbandonedTicket: t.Integer(),
});

export const FinancialAnalyticsReturn = t.Object({
	cancellation: CancellationSummary,
	comparison: t.Object({
		averageOrderValuePercent: t.Nullable(t.Number()),
		cancelRatePercentPoints: t.Nullable(t.Number()),
		grossMarginPercent: t.Nullable(t.Number()),
		grossProfitPercent: t.Nullable(t.Number()),
		lostRevenuePercent: t.Nullable(t.Number()),
		netRevenuePercent: t.Nullable(t.Number()),
		orderCountPercent: t.Nullable(t.Number()),
		refundedPercent: t.Nullable(t.Number()),
	}),
	distribution: t.Object({
		delivery: t.Array(FinancialDistributionItem),
		payment: t.Array(FinancialDistributionItem),
	}),
	groupBy: t.Union([
		t.Literal("hourOfDay"),
		t.Literal("dayOfWeek"),
		t.Literal("dayOfMonth"),
		t.Literal("month"),
		t.Literal("quarter"),
		t.Literal("year"),
	]),
	paymentAbandonment: PaymentAbandonmentSummary,
	summary: FinancialSummary,
	trend: t.Array(FinancialTrendItem),
});
export type FinancialAnalyticsReturn = typeof FinancialAnalyticsReturn.static;

const BusinessCustomerMetrics = t.Object({
	newCustomers: t.Integer(),
	ordersPerCustomer: t.Number(),
	repeatRatePercent: t.Number(),
	returningCustomers: t.Integer(),
	revenuePerCustomer: t.Integer(),
});

const TopCouponItem = t.Object({
	code: t.String(),
	discountCents: t.Integer(),
	orderCount: t.Integer(),
	revenueCents: t.Integer(),
	type: t.String(),
});

const BusinessDiscountMetrics = t.Object({
	cashbackRedeemedCents: t.Integer(),
	couponOrderCount: t.Integer(),
	discountCents: t.Integer(),
	discountShareOfGrossPercent: t.Number(),
	loyaltyPointsRedeemed: t.Integer(),
	topCoupons: t.Array(TopCouponItem),
});

const PeakItem = t.Object({ key: t.String(), label: t.String(), orderCount: t.Integer(), revenueCents: t.Integer() });

const BusinessOperationsMetrics = t.Object({
	averageDeliveryMinutes: t.Nullable(t.Number()),
	averageFulfillmentMinutes: t.Nullable(t.Number()),
	averagePrepMinutes: t.Nullable(t.Number()),
	peaks: t.Object({ byDayOfWeek: t.Array(PeakItem), byHourOfDay: t.Array(PeakItem) }),
	problemRatePercent: t.Number(),
});

const BusinessUnitMetrics = t.Object({
	averageOrderValue: t.Integer(),
	cancelRatePercent: t.Number(),
	canceledOrderCount: t.Integer(),
	grossMarginPercent: t.Nullable(t.Number()),
	grossProfitCents: t.Integer(),
	knownCostCents: t.Integer(),
	netRevenueCents: t.Integer(),
	orderCount: t.Integer(),
	unitId: t.String(),
	unitName: t.String(),
});

export const BusinessMetricsReturn = t.Object({
	customers: BusinessCustomerMetrics,
	discounts: BusinessDiscountMetrics,
	operations: BusinessOperationsMetrics,
	units: t.Array(BusinessUnitMetrics),
});
export type BusinessMetricsReturn = typeof BusinessMetricsReturn.static;

const ProductIngredientBreakdown = t.Object({
	costCents: t.Integer(),
	costSharePercent: t.Number(),
	inventoryItemId: t.String(),
	name: t.String(),
	quantity: t.Number(),
	unit: t.String(),
	unitCostCents: t.Integer(),
});

export const ProductProfitabilityItem = t.Object({
	grossMarginPercent: t.Optional(t.Nullable(t.Number())),
	grossProfitCents: t.Optional(t.Integer()),
	hasRecipe: t.Boolean(),
	ingredients: t.Array(ProductIngredientBreakdown),
	knownCostCents: t.Optional(t.Integer()),
	knownNetRevenueCents: t.Optional(t.Integer()),
	priceCents: t.Nullable(t.Integer()),
	productId: t.String(),
	productName: t.String(),
	theoreticalCostCents: t.Nullable(t.Integer()),
	theoreticalMarginPercent: t.Nullable(t.Number()),
	theoreticalProfitCents: t.Nullable(t.Integer()),
	totalQuantity: t.Integer(),
	totalRevenue: t.Integer(),
	wastedCostCents: t.Integer(),
});
export type ProductProfitabilityItem = typeof ProductProfitabilityItem.static;

export const ProductProfitabilityReturn = t.Array(ProductProfitabilityItem);
export type ProductProfitabilityReturn = typeof ProductProfitabilityReturn.static;
