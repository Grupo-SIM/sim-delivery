import { t } from "elysia";

export const UpdateCompanyBody = t.Object({
	apiUrl: t.Optional(t.String({ format: "uri" })),
	name: t.Optional(t.String({ minLength: 1 })),
	packageName: t.Optional(t.String({ minLength: 1 })),
	siteUrl: t.Optional(t.String({ format: "uri" })),
	slug: t.Optional(t.String({ minLength: 1, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" })),
});
export type UpdateCompanyBody = typeof UpdateCompanyBody.static;
