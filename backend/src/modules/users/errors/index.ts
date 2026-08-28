import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const UserErrors = createEnumFromArray([
	"ACCOUNT_ALREADY_EXISTS",
	"ACCOUNT_NOT_FOUND",
	"WRONG_CREDENTIALS",
	"FORBIDDEN",
]);

export const UserErrorsStatusCodes: Record<keyof typeof UserErrors, StatusCodes> = {
	ACCOUNT_ALREADY_EXISTS: StatusCodes.CONFLICT,
	ACCOUNT_NOT_FOUND: StatusCodes.NOT_FOUND,
	FORBIDDEN: StatusCodes.FORBIDDEN,
	WRONG_CREDENTIALS: StatusCodes.UNAUTHORIZED,
};
