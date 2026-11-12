import { t } from "elysia";

const Kind = t.Union([t.Literal("real"), t.Literal("fake")]);
const Type = t.Union([t.Literal("percent"), t.Literal("fixed")]);

/** Editable discount fields shared by create (required name/kind/type/value) and update (all optional). */
const fields = {
	active: t.Optional(t.Boolean()),
	categoryIds: t.Optional(t.Array(t.String())),
	endsAt: t.Optional(t.Nullable(t.String({ format: "date-time" }))),
	productIds: t.Optional(t.Array(t.String())),
	startsAt: t.Optional(t.Nullable(t.String({ format: "date-time" }))),
	tagIds: t.Optional(t.Array(t.String())),
	unitIds: t.Optional(t.Array(t.String())),
};

export const CreateDiscountBody = t.Object({
	...fields,
	kind: Kind,
	name: t.String({ minLength: 1 }),
	type: Type,
	value: t.Integer({ minimum: 1 }),
});
export type CreateDiscountBody = typeof CreateDiscountBody.static;

export const UpdateDiscountBody = t.Object({
	...fields,
	kind: t.Optional(Kind),
	name: t.Optional(t.String({ minLength: 1 })),
	type: t.Optional(Type),
	value: t.Optional(t.Integer({ minimum: 1 })),
});
export type UpdateDiscountBody = typeof UpdateDiscountBody.static;
