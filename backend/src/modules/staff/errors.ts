import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const StaffErrors = createEnumFromArray(["EMAIL_TAKEN", "STAFF_NOT_FOUND", "NO_COMPANY"]);

export const StaffErrorsStatusCodes: Record<keyof typeof StaffErrors, StatusCodes> = {
	EMAIL_TAKEN: StatusCodes.CONFLICT,
	NO_COMPANY: StatusCodes.BAD_REQUEST,
	STAFF_NOT_FOUND: StatusCodes.NOT_FOUND,
};
