import { t } from "elysia";

export const UpdateStaffUnitsBody = t.Object({
	unitIds: t.Array(t.String({ minLength: 1 })),
});
export type UpdateStaffUnitsBody = typeof UpdateStaffUnitsBody.static;
