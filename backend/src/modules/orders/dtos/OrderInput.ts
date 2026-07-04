import { t } from "elysia";

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
	unitId: t.String({ minLength: 1 }),
	variantKey: t.String({ minLength: 1 }),
});
export type CreateOrderBody = typeof CreateOrderBody.static;
