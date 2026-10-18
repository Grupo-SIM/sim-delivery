import { t } from "elysia";

export const UpdateCompanyBody = t.Object({
	apiUrl: t.Optional(t.String({ format: "uri", pattern: "^https?://[^/?#@]+/?$" })),
	name: t.Optional(t.String({ minLength: 1 })),
	ownerEmail: t.Optional(t.Nullable(t.String({ format: "email" }))),
	packageName: t.Optional(t.String({ minLength: 1 })),
	siteUrl: t.Optional(t.String({ format: "uri", pattern: "^https?://[^/?#@]+/?$" })),
	slug: t.Optional(t.String({ minLength: 1, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" })),
});
export type UpdateCompanyBody = typeof UpdateCompanyBody.static;
