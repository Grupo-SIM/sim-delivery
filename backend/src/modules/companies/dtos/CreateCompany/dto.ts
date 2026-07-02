import { t } from "elysia";
import { CreateCompanyBody } from "./body";

export const CreateCompanyDTO = t.Object({ ...CreateCompanyBody.properties });
export type CreateCompanyDTO = typeof CreateCompanyDTO.static;
