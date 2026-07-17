import { t } from "elysia";

/** Per-unit association overrides shared by associate (create) and update. */
const fields = {
	available: t.Optional(t.Boolean()),
	cashbackPercentOverride: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
	categoryIds: t.Optional(t.Nullable(t.Array(t.String(), { uniqueItems: true }))),
	priceCentsOverride: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
	stock: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
	tagIds: t.Optional(t.Nullable(t.Array(t.String(), { uniqueItems: true }))),
};

export const AssociateProductBody = t.Object({ ...fields, productId: t.String({ minLength: 1 }) });
export type AssociateProductBody = typeof AssociateProductBody.static;

export const UpdateUnitProductBody = t.Object({ ...fields });
export type UpdateUnitProductBody = typeof UpdateUnitProductBody.static;
