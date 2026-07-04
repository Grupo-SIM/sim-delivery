import { t } from "elysia";

export const UpdateOrderStatusBody = t.Object({
	cancelReason: t.Optional(t.String({ minLength: 1 })),
	status: t.Union([
		t.Literal("em_preparo"),
		t.Literal("pronto"),
		t.Literal("saiu_para_entrega"),
		t.Literal("entregue"),
		t.Literal("retirado"),
		t.Literal("cancelado"),
	]),
});
export type UpdateOrderStatusBody = typeof UpdateOrderStatusBody.static;

export const ListOrdersQuery = t.Object({
	deliveryMethod: t.Optional(t.Union([t.Literal("delivery"), t.Literal("pickup")])),
	from: t.Optional(t.String()),
	hasCoupon: t.Optional(t.Boolean()),
	search: t.Optional(t.String()),
	status: t.Optional(t.String()),
	to: t.Optional(t.String()),
	unitId: t.Optional(t.String()),
});
export type ListOrdersQuery = typeof ListOrdersQuery.static;

export const CreateOrderItemBody = t.Object({
	note: t.Optional(t.String()),
	quantity: t.Integer({ minimum: 1 }),
	unitProductId: t.String({ minLength: 1 }),
});
export type CreateOrderItemBody = typeof CreateOrderItemBody.static;

export const CreateOrderBody = t.Object({
	addressId: t.Optional(t.String()),
	couponCode: t.Optional(t.String()),
	deliveryMethod: t.Union([t.Literal("delivery"), t.Literal("pickup")]),
	items: t.Array(CreateOrderItemBody, { minItems: 1 }),
	redeemCashbackCents: t.Optional(t.Integer({ minimum: 0 })),
	redeemLoyaltyPoints: t.Optional(t.Integer({ minimum: 0 })),
	unitId: t.String({ minLength: 1 }),
	variantKey: t.String({ minLength: 1 }),
});
export type CreateOrderBody = typeof CreateOrderBody.static;
