import { t } from "elysia";

export const InviteStaffBody = t.Object({
	email: t.String({ format: "email" }),
	level: t.Optional(t.Union([t.Literal("manager"), t.Literal("attendant"), t.Literal("kitchen")])),
	name: t.String({ minLength: 1 }),
	password: t.String({ minLength: 6 }),
	role: t.Optional(t.Union([t.Literal("employee"), t.Literal("courier")])),
});
export type InviteStaffBody = typeof InviteStaffBody.static;
