import { t } from "elysia";
import { UpdateStaffLevelBody } from "./body";

export const UpdateStaffLevelDTO = t.Object({
	...UpdateStaffLevelBody.properties,
	companyId: t.Nullable(t.String()),
	staffId: t.String(),
});
export type UpdateStaffLevelDTO = typeof UpdateStaffLevelDTO.static;
