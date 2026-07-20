import { t } from "elysia";

/** Editable coupon fields shared by create (required code/type/value) and update (all optional). */
const fields = {
	expiresAt: t.Optional(t.Nullable(t.String({ format: "date-time" }))),
	maxUses: t.Optional(t.Nullable(t.Integer({ minimum: 1 }))),
	minOrderCents: t.Optional(t.Integer({ minimum: 0 })),
	unitId: t.Optional(t.Nullable(t.String())),
};

export const CreateCouponBody = t.Object({
	...fields,
	code: t.String({ minLength: 1 }),
	type: t.Union([t.Literal("percent"), t.Literal("fixed")]),
	value: t.Integer({ minimum: 1 }),
});
export type CreateCouponBody = typeof CreateCouponBody.static;

export const UpdateCouponBody = t.Object({
	...fields,
	code: t.Optional(t.String({ minLength: 1 })),
	type: t.Optional(t.Union([t.Literal("percent"), t.Literal("fixed")])),
	value: t.Optional(t.Integer({ minimum: 1 })),
});
export type UpdateCouponBody = typeof UpdateCouponBody.static;
