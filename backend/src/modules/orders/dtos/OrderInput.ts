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
	estimatedMinutes: t.Optional(t.Integer({ maximum: 1440, minimum: 1 })),
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
	/** Filters by first-touch UTM (any subset). `bio` is the Instagram link-in-bio preset. */
	utmCampaign: t.Optional(t.String()),
	utmContent: t.Optional(t.String()),
	utmMedium: t.Optional(t.String()),
	utmSource: t.Optional(t.String()),
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
export const MarketingAttribution = t.Object({
    consent: t.Literal(true),
    utm: t.Optional(t.Object({source: t.Optional(t.String({maxLength:200})),medium: t.Optional(t.String({maxLength:200})),campaign: t.Optional(t.String({maxLength:200})),term: t.Optional(t.String({maxLength:200})),content: t.Optional(t.String({maxLength:200}))})),
    consentVersion: t.String({ minLength: 1, maxLength: 64 }),
    deviceId: t.Optional(t.String({ format: "uuid" })),
    fbp: t.Optional(t.String({ maxLength: 256, pattern: "^fb\\.[0-9]+\\.[0-9]+\\.[A-Za-z0-9_-]+$" })),
    fbc: t.Optional(t.String({ maxLength: 1024, pattern: "^fb\\.[0-9]+\\.[0-9]+\\.[A-Za-z0-9_-]+$" })),
    sourceUrl: t.Optional(t.String({ format: "uri", pattern: "^https?://", maxLength: 2048 })),
});
const UtmValue = t.Optional(t.String({ maxLength: 200 }));
export const UtmSet = t.Object({ campaign: UtmValue, content: UtmValue, medium: UtmValue, source: UtmValue, term: UtmValue });
export type UtmSet = typeof UtmSet.static;
/** Campaign origin of the order. Independent of marketing consent: UTM labels carry no personal data. */
export const OrderOrigin = t.Object({
	fbclid: t.Optional(t.String({ maxLength: 500, pattern: "^[A-Za-z0-9_-]+$" })),
	first: t.Optional(UtmSet),
	last: t.Optional(UtmSet),
});
export type OrderOrigin = typeof OrderOrigin.static;
export const CreateOrderBody = t.Object({
	origin: t.Optional(OrderOrigin),
    marketingAttribution: t.Optional(MarketingAttribution),
	addressId: t.Optional(t.Nullable(t.String({ minLength: 1 }))),
	couponCode: t.Optional(t.String()),
	deliveryMethod: t.Union([t.Literal("delivery"), t.Literal("pickup")]),
	idempotencyKey: t.String({ format: "uuid" }),
	items: t.Array(CreateOrderItemBody, { minItems: 1 }),
	redeemCashbackCents: t.Optional(t.Integer({ minimum: 0 })),
	redeemLoyaltyPoints: t.Optional(t.Integer({ minimum: 0 })),
	slug: t.String({ minLength: 1 }),
	unitSlug: t.String({ minLength: 1 }),
});
export type CreateOrderBody = typeof CreateOrderBody.static;

export const QuoteOrderFeesBody = t.Object({
	items: t.Array(
		t.Object({
			options: t.Optional(
				t.Array(t.Object({ optionId: t.String({ minLength: 1 }), quantity: t.Integer({ minimum: 1 }) })),
			),
			quantity: t.Integer({ minimum: 1 }),
			unitProductId: t.String({ minLength: 1 }),
		}),
		{ minItems: 1 },
	),
	slug: t.String({ minLength: 1 }),
	unitSlug: t.String({ minLength: 1 }),
});
export type QuoteOrderFeesBody = typeof QuoteOrderFeesBody.static;

export const GetOriginMetricsQuery = t.Object({
	from: t.Optional(t.String()),
	search: t.Optional(t.String()),
	to: t.Optional(t.String()),
	unitId: t.Optional(t.String()),
	utmCampaign: t.Optional(t.String()),
	utmContent: t.Optional(t.String()),
	utmMedium: t.Optional(t.String()),
	utmSource: t.Optional(t.String()),
});
export type GetOriginMetricsQuery = typeof GetOriginMetricsQuery.static;
