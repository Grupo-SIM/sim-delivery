import { t } from "elysia";
import { __nullable__ } from "sql/typebox";

export const AdminOrderReturn = t.Object({
	addressId: __nullable__(t.String()),
	cancelReason: __nullable__(t.String()),
	cashbackCentsRedeemed: t.Integer(),
	companyId: t.String(),
	couponId: __nullable__(t.String()),
	createdAt: t.Date(),
	customerName: t.String(),
	customerPhone: __nullable__(t.String()),
	customerId: t.String(),
	delivery: __nullable__(t.Object({ id: t.String() })),
	deliveryFee: t.Integer(),
	deliveryMethod: t.String(),
	discountCents: t.Integer(),
	id: t.String(),
	items: t.Array(
		t.Object({
			id: t.String(),
			note: __nullable__(t.String()),
			orderId: t.String(),
			productId: t.String(),
			productName: t.String(),
			quantity: t.Integer(),
			total: t.Integer(),
			unitPrice: t.Integer(),
		}),
	),
	loyaltyPointsRedeemed: t.Integer(),
	status: t.String(),
	subtotal: t.Integer(),
	total: t.Integer(),
	unitId: t.String(),
	unitName: t.String(),
	updatedAt: t.Date(),
});
export type AdminOrderReturn = typeof AdminOrderReturn.static;

export const AdminOrderListReturn = t.Array(AdminOrderReturn);
export type AdminOrderListReturn = typeof AdminOrderListReturn.static;

export const OrderItemReturn = t.Object({
	id: t.String(),
	note: __nullable__(t.String()),
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
	loyaltyPointsRedeemed: t.Integer(),
	companyId: t.String(),
	couponId: __nullable__(t.String()),
	createdAt: t.Date(),
	customerId: t.String(),
	deliveryFee: t.Integer(),
	deliveryMethod: t.String(),
	discountCents: t.Integer(),
	id: t.String(),
	items: t.Array(OrderItemReturn),
	status: t.String(),
	subtotal: t.Integer(),
	total: t.Integer(),
	unitId: t.String(),
	updatedAt: t.Date(),
});
export type OrderReturn = typeof OrderReturn.static;
