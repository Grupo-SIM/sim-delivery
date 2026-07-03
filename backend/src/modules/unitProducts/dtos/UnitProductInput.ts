import { t } from "elysia";

/** Per-unit association overrides shared by associate (create) and update. */
const fields = {
	available: t.Optional(t.Boolean()),
	cashbackPercentOverride: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
	categoryId: t.Optional(t.Nullable(t.String())),
	priceCentsOverride: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
	stock: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
};

export const AssociateProductBody = t.Object({ ...fields, productId: t.String({ minLength: 1 }) });
export type AssociateProductBody = typeof AssociateProductBody.static;

export const UpdateUnitProductBody = t.Object({ ...fields });
export type UpdateUnitProductBody = typeof UpdateUnitProductBody.static;
