import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const CompanyErrors = createEnumFromArray(["SLUG_TAKEN", "COMPANY_NOT_FOUND"]);

export const CompanyErrorsStatusCodes: Record<keyof typeof CompanyErrors, StatusCodes> = {
	COMPANY_NOT_FOUND: StatusCodes.NOT_FOUND,
	SLUG_TAKEN: StatusCodes.CONFLICT,
};
