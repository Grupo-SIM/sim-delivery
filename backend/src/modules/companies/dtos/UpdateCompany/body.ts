import { t } from "elysia";

export const UpdateCompanyBody = t.Object({
	name: t.Optional(t.String({ minLength: 1 })),
	slug: t.Optional(t.String({ minLength: 1, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" })),
});
export type UpdateCompanyBody = typeof UpdateCompanyBody.static;
