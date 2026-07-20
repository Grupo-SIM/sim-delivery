import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const CustomerErrors = createEnumFromArray(["COMPANY_NOT_FOUND", "CUSTOMER_NOT_FOUND"]);

export const CustomerErrorsStatusCodes: Record<keyof typeof CustomerErrors, StatusCodes> = {
	COMPANY_NOT_FOUND: StatusCodes.NOT_FOUND,
	CUSTOMER_NOT_FOUND: StatusCodes.NOT_FOUND,
};
