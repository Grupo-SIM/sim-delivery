import { t } from "elysia";
import { UpdateCompanyBody } from "./body";

export const UpdateCompanyDTO = t.Object({
	...UpdateCompanyBody.properties,
	companyId: t.String(),
});
export type UpdateCompanyDTO = typeof UpdateCompanyDTO.static;
