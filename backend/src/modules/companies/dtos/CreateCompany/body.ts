import { t } from "elysia";

export const CreateCompanyBody = t.Object({
	apiUrl: t.Optional(t.String({ format: "uri" })),
	name: t.String({ minLength: 1 }),
	packageName: t.Optional(t.String({ minLength: 1 })),
	siteUrl: t.Optional(t.String({ format: "uri" })),
	/** URL-safe tenant identifier; unique across the platform. */
	slug: t.String({ minLength: 1, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }),
});
export type CreateCompanyBody = typeof CreateCompanyBody.static;
