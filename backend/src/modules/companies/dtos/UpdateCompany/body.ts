import { t } from "elysia";

export const UpdateCompanyBody = t.Object({
	name: t.Optional(t.String({ minLength: 1 })),
	/** Whitelabel variant key; pass null to unlink. Unique across the platform. */
	variantKey: t.Optional(t.Nullable(t.String({ minLength: 1 }))),
});
export type UpdateCompanyBody = typeof UpdateCompanyBody.static;
