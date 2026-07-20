import { t } from "elysia";

export const UpdateStaffRoleBody = t.Object({
	role: t.Union([t.Literal("manager"), t.Literal("attendant"), t.Literal("kitchen"), t.Literal("courier")]),
});
export type UpdateStaffRoleBody = typeof UpdateStaffRoleBody.static;
