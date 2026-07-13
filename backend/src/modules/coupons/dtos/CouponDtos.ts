import { t } from "elysia";

export const ValidateCouponBody = t.Object({
	code: t.String({ minLength: 1 }),
	orderSubtotal: t.Integer({ minimum: 0 }),
	slug: t.String({ minLength: 1 }),
	unitId: t.String({ minLength: 1 }),
});
export type ValidateCouponBody = typeof ValidateCouponBody.static;

export const ValidateCouponReturn = t.Object({
	couponId: t.String(),
	discountCents: t.Integer(),
	type: t.Union([t.Literal("percent"), t.Literal("fixed")]),
	value: t.Integer(),
});
export type ValidateCouponReturn = typeof ValidateCouponReturn.static;
