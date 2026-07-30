import { t } from "elysia";
import { UpdateStaffUnitsBody } from "./body";

export const UpdateStaffUnitsDTO = t.Object({
	...UpdateStaffUnitsBody.properties,
	companyId: t.Nullable(t.String()),
	staffId: t.String(),
});
export type UpdateStaffUnitsDTO = typeof UpdateStaffUnitsDTO.static;
