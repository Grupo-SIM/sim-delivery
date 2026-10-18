import { t } from "elysia";

export const ProvisionOwnerBody = t.Object({
	email: t.String({ format: "email" }),
	password: t.Optional(t.String({ maxLength: 128, minLength: 6 })),
});
export type ProvisionOwnerBody = typeof ProvisionOwnerBody.static;
