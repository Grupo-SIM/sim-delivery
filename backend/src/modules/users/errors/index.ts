import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const UserErrors = createEnumFromArray(["WRONG_CREDENTIALS", "FORBIDDEN"]);

export const UserErrorsStatusCodes: Record<keyof typeof UserErrors, StatusCodes> = {
	FORBIDDEN: StatusCodes.FORBIDDEN,
	WRONG_CREDENTIALS: StatusCodes.UNAUTHORIZED,
};
