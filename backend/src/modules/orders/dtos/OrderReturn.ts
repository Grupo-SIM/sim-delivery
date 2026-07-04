import { t } from "elysia";
import { __nullable__ } from "sql/typebox";

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
