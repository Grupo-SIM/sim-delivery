import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const LoyaltyErrors = createEnumFromArray([
	"COMPANY_NOT_FOUND",
	"CUSTOMER_NOT_FOUND",
	"INSUFFICIENT_BALANCE",
]);

export const LoyaltyErrorsStatusCodes: Record<keyof typeof LoyaltyErrors, StatusCodes> = {
	COMPANY_NOT_FOUND: StatusCodes.NOT_FOUND,
	CUSTOMER_NOT_FOUND: StatusCodes.NOT_FOUND,
	INSUFFICIENT_BALANCE: StatusCodes.UNPROCESSABLE_ENTITY,
};
