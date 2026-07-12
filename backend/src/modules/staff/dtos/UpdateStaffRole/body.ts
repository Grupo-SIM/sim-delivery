import { t } from "elysia";

export const UpdateStaffLevelBody = t.Object({
	level: t.Union([t.Literal("manager"), t.Literal("attendant"), t.Literal("kitchen")]),
});
export type UpdateStaffLevelBody = typeof UpdateStaffLevelBody.static;
