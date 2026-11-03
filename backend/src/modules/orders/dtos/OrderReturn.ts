import { t } from "elysia";
import { __nullable__ } from "sql/typebox";

export const OrderFeeReturn = t.Object({
	amountCents: t.Integer(),
	applicationScope: t.String(),
	configuredFixed: t.Integer(),
	configuredPercentage: t.Integer(),
	displayMode: t.String(),
	id: t.String(),
	name: t.String(),
});

export const QuoteOrderFeesReturn = t.Object({
	embeddedFeeTotalCents: t.Integer(),
	feeTotalCents: t.Integer(),
	fees: t.Array(
		t.Object({
			...OrderFeeReturn.properties,
			components: t.Optional(t.Array(t.Object({ amountCents: t.Integer(), name: t.String() }))),
			items: t.Array(
				t.Object({
					amountCents: t.Integer(),
					itemKey: t.String(),
					unitAmountCents: t.Integer(),
				}),
			),
		}),
	),
	visibleFeeTotalCents: t.Integer(),
});
export type QuoteOrderFeesReturn = typeof QuoteOrderFeesReturn.static;

export const AdminOrderReturn = t.Object({
	addressId: __nullable__(t.String()),
	cancelReason: __nullable__(t.String()),
	cashbackCentsRedeemed: t.Integer(),
	companyId: t.String(),
	couponCode: __nullable__(t.String()),
	couponId: __nullable__(t.String()),
	couponType: __nullable__(t.String()),
	couponValue: __nullable__(t.Integer()),
	createdAt: t.Date(),
	customerId: t.String(),
	customerName: t.String(),
	customerPhone: __nullable__(t.String()),
	delivery: __nullable__(t.Object({ courierId: t.String(), courierName: t.String(), id: t.String() })),
	deliveryFee: t.Integer(),
	deliveryMethod: t.String(),
	displayNumber: t.Integer(),
	discountCents: t.Integer(),
	feeTotalCents: t.Integer(),
	fees: t.Array(OrderFeeReturn),
	estimatedStatusCompletionAt: __nullable__(t.Date()),
	id: t.String(),
	items: t.Array(
		t.Object({
			displayTotal: t.Integer(),
			displayUnitPrice: t.Integer(),
			id: t.String(),
			imageUrl: __nullable__(t.String()),
			note: __nullable__(t.String()),
			options: t.Array(
				t.Object({
					groupName: t.String(),
					id: t.String(),
					optionId: __nullable__(t.String()),
					optionName: t.String(),
					priceDeltaCents: t.Integer(),
					quantity: t.Integer(),
				}),
			),
			orderId: t.String(),
			productId: t.String(),
			productName: t.String(),
			quantity: t.Integer(),
			total: t.Integer(),
			unitPrice: t.Integer(),
		}),
	),
	loyaltyPointsRedeemed: t.Integer(),
	payment: __nullable__(
		t.Object({
			/** "pending" | "confirmed" | "failed" | "partially_refunded" | "refunded" */
			status: t.String(),
		}),
	),
	preparedBy: __nullable__(t.Object({ id: t.String(), name: t.String() })),
	problemReason: __nullable__(t.String()),
	refundedCents: t.Integer(),
	status: t.String(),
	subtotal: t.Integer(),
	total: t.Integer(),
	unitId: t.String(),
	unitName: t.String(),
	unitPrepTimeMaxMinutes: __nullable__(t.Integer()),
	unitPrepTimeMinMinutes: __nullable__(t.Integer()),
	updatedAt: t.Date(),
});
export type AdminOrderReturn = typeof AdminOrderReturn.static;

export const AdminOrderListReturn = t.Array(AdminOrderReturn);
export type AdminOrderListReturn = typeof AdminOrderListReturn.static;

export const OrderItemReturn = t.Object({
	displayTotal: t.Optional(t.Integer()),
	displayUnitPrice: t.Optional(t.Integer()),
	fees: t.Optional(t.Array(t.Object({ amountCents: t.Integer(), unitAmountCents: t.Integer() }))),
	id: t.String(),
	note: __nullable__(t.String()),
	options: t.Array(
		t.Object({
			groupName: t.String(),
			id: t.String(),
			optionId: __nullable__(t.String()),
			optionName: t.String(),
			priceDeltaCents: t.Integer(),
			quantity: t.Integer(),
		}),
	),
	orderId: t.String(),
	productId: t.String(),
	productName: t.String(),
	quantity: t.Integer(),
	total: t.Integer(),
	unitPrice: t.Integer(),
});
export type OrderItemReturn = typeof OrderItemReturn.static;

export const OrderReturn = t.Object({
	addressId: __nullable__(t.String()),
	cancelReason: __nullable__(t.String()),
	cashbackCentsRedeemed: t.Integer(),
	companyId: t.String(),
	couponId: __nullable__(t.String()),
	createdAt: t.Date(),
	customerId: t.String(),
	deliveryFee: t.Integer(),
	deliveryMethod: t.String(),
	displayNumber: t.Integer(),
	discountCents: t.Integer(),
	feeTotalCents: t.Integer(),
	fees: t.Optional(t.Array(OrderFeeReturn)),
	estimatedStatusCompletionAt: __nullable__(t.Date()),
	id: t.String(),
	items: t.Array(OrderItemReturn),
	loyaltyPointsRedeemed: t.Integer(),
	preparedById: __nullable__(t.String()),
	problemReason: __nullable__(t.String()),
	status: t.String(),
	subtotal: t.Integer(),
	total: t.Integer(),
	unitId: t.String(),
	updatedAt: t.Date(),
});
export type OrderReturn = typeof OrderReturn.static;

export const OrderStatusEventReturn = t.Object({
	createdAt: t.Date(),
	id: t.String(),
	status: t.String(),
});
export type OrderStatusEventReturn = typeof OrderStatusEventReturn.static;

export const CustomerOrderTrackingReturn = t.Object({
	cancelReason: __nullable__(t.String()),
	createdAt: t.Date(),
	deliveryMethod: t.String(),
	displayNumber: t.Integer(),
	estimatedStatusCompletionAt: __nullable__(t.Date()),
	id: t.String(),
	items: t.Array(
		t.Object({
			...OrderItemReturn.properties,
			imageUrl: __nullable__(t.String()),
		}),
	),
	hasOrderReview: t.Boolean(),
	problemReason: __nullable__(t.String()),
	reviewedProductIds: t.Array(t.String()),
	status: t.String(),
	statusEvents: t.Array(OrderStatusEventReturn),
	total: t.Integer(),
	unitName: t.String(),
	unitSlug: t.String(),
});
export type CustomerOrderTrackingReturn = typeof CustomerOrderTrackingReturn.static;

export const CustomerOrderSummaryReturn = t.Object({
	createdAt: t.Date(),
	deliveryMethod: t.String(),
	displayNumber: t.Integer(),
	id: t.String(),
	itemsCount: t.Integer(),
	status: t.String(),
	total: t.Integer(),
	unitName: t.String(),
	unitSlug: t.String(),
});
export type CustomerOrderSummaryReturn = typeof CustomerOrderSummaryReturn.static;

export const CustomerOrderListReturn = t.Array(CustomerOrderSummaryReturn);
export type CustomerOrderListReturn = typeof CustomerOrderListReturn.static;
