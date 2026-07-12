import { t } from "elysia";
import { UpdateStaffRoleBody } from "./body";

export const UpdateStaffRoleDTO = t.Object({
	...UpdateStaffRoleBody.properties,
	companyId: t.Nullable(t.String()),
	staffId: t.String(),
});
export type UpdateStaffRoleDTO = typeof UpdateStaffRoleDTO.static;
