import { t } from "elysia";

export const CreateCompanyBody = t.Object({
	name: t.String({ minLength: 1 }),
	/** URL-safe tenant identifier; unique across the platform. */
	slug: t.String({ minLength: 1, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }),
});
export type CreateCompanyBody = typeof CreateCompanyBody.static;
