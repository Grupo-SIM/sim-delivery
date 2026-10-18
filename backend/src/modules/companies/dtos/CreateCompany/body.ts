import { t } from "elysia";

export const CreateCompanyBody = t.Object({
	apiUrl: t.Optional(t.String({ format: "uri", pattern: "^https?://[^/?#@]+/?$" })),
	name: t.String({ minLength: 1 }),
	ownerEmail: t.Optional(t.Nullable(t.String({ format: "email" }))),
	packageName: t.Optional(t.String({ minLength: 1 })),
	siteUrl: t.Optional(t.String({ format: "uri", pattern: "^https?://[^/?#@]+/?$" })),
	/** URL-safe tenant identifier; unique across the platform. */
	slug: t.String({ minLength: 1, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }),
});
export type CreateCompanyBody = typeof CreateCompanyBody.static;
