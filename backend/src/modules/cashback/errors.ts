import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const CashbackErrors = createEnumFromArray([
	"COMPANY_NOT_FOUND",
	"CUSTOMER_NOT_FOUND",
	"INSUFFICIENT_BALANCE",
]);

export const CashbackErrorsStatusCodes: Record<keyof typeof CashbackErrors, StatusCodes> = {
	COMPANY_NOT_FOUND: StatusCodes.NOT_FOUND,
	CUSTOMER_NOT_FOUND: StatusCodes.NOT_FOUND,
	INSUFFICIENT_BALANCE: StatusCodes.UNPROCESSABLE_ENTITY,
};
