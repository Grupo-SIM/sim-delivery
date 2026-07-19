import { t } from "elysia";

export const UpdateCourierUnitsBody = t.Object({
	unitIds: t.Array(t.String({ minLength: 1 })),
});
export type UpdateCourierUnitsBody = typeof UpdateCourierUnitsBody.static;
