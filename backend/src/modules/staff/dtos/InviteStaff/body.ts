import { t } from "elysia";

export const InviteStaffBody = t.Object({
	email: t.String({ format: "email" }),
	name: t.String({ minLength: 1 }),
	role: t.Union([t.Literal("manager"), t.Literal("attendant"), t.Literal("kitchen"), t.Literal("courier")]),
	unitIds: t.Optional(t.Array(t.String({ minLength: 1 }))),
});
export type InviteStaffBody = typeof InviteStaffBody.static;
