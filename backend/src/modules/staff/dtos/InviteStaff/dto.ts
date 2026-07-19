import { t } from "elysia";
import { InviteStaffBody } from "./body";

export const InviteStaffDTO = t.Object({
	...InviteStaffBody.properties,
	companyId: t.Nullable(t.String()),
	unitIds: t.Optional(t.Array(t.String())),
});
export type InviteStaffDTO = typeof InviteStaffDTO.static;
