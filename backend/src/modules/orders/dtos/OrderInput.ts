import { t } from "elysia";

export const CancelOrderRefundBody = t.Object({
	/** Cents to refund; omit for a full refund of whatever hasn't been refunded yet. */
	amount: t.Optional(t.Integer({ minimum: 1 })),
	method: t.Union([t.Literal("gateway"), t.Literal("manual"), t.Literal("cashback")]),
	reason: t.Optional(t.String({ maxLength: 240 })),
});
export type CancelOrderRefundBody = typeof CancelOrderRefundBody.static;

export const UpdateOrderStatusBody = t.Object({
	cancelReason: t.Optional(t.String({ minLength: 1 })),
	preparedById: t.Optional(t.Nullable(t.String({ minLength: 1 }))),
	problemReason: t.Optional(t.String({ minLength: 1 })),
	/** Only applied when transitioning to "cancelado" against a confirmed payment. */
	refund: t.Optional(CancelOrderRefundBody),
	status: t.Union([
		t.Literal("recebido"),
		t.Literal("em_preparo"),
		t.Literal("pronto"),
		t.Literal("saiu_para_entrega"),
		t.Literal("problema"),
		t.Literal("entregue"),
		t.Literal("retirado"),
		t.Literal("cancelado"),
	]),
});
export type UpdateOrderStatusBody = typeof UpdateOrderStatusBody.static;

export const ListOrdersQuery = t.Object({
	customerId: t.Optional(t.String()),
	deliveryMethod: t.Optional(t.Union([t.Literal("delivery"), t.Literal("pickup")])),
	from: t.Optional(t.String()),
	hasCoupon: t.Optional(t.Boolean()),
	search: t.Optional(t.String()),
	status: t.Optional(t.String()),
	to: t.Optional(t.String()),
	unitId: t.Optional(t.String()),
});
export type ListOrdersQuery = typeof ListOrdersQuery.static;
export const CloseOrdersDayReturn = t.Object({ orderBoardStartedAt: t.String() });
export type CloseOrdersDayReturn = typeof CloseOrdersDayReturn.static;

export const GetCustomerOrderQuery = t.Object({ slug: t.String({ minLength: 1 }) });
export type GetCustomerOrderQuery = typeof GetCustomerOrderQuery.static;
export const CreateOrderItemBody = t.Object({
	note: t.Optional(t.String()),
	options: t.Optional(
		t.Array(t.Object({ optionId: t.String({ minLength: 1 }), quantity: t.Integer({ minimum: 1 }) })),
	),
	quantity: t.Integer({ minimum: 1 }),
	unitProductId: t.String({ minLength: 1 }),
});
export type CreateOrderItemBody = typeof CreateOrderItemBody.static;
export const CreateOrderBody = t.Object({
	addressId: t.String({ minLength: 1 }),
	couponCode: t.Optional(t.String()),
	deliveryMethod: t.Union([t.Literal("delivery"), t.Literal("pickup")]),
	items: t.Array(CreateOrderItemBody, { minItems: 1 }),
	redeemCashbackCents: t.Optional(t.Integer({ minimum: 0 })),
	redeemLoyaltyPoints: t.Optional(t.Integer({ minimum: 0 })),
	slug: t.String({ minLength: 1 }),
	unitSlug: t.String({ minLength: 1 }),
});
export type CreateOrderBody = typeof CreateOrderBody.static;
