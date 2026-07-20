import { t } from "elysia";
import { UpdateCourierUnitsBody } from "./body";

export const UpdateCourierUnitsDTO = t.Object({
	...UpdateCourierUnitsBody.properties,
	companyId: t.Nullable(t.String()),
	courierId: t.String(),
});
export type UpdateCourierUnitsDTO = typeof UpdateCourierUnitsDTO.static;
