import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const StaffErrors = createEnumFromArray([
	"EMAIL_TAKEN",
	"STAFF_NOT_FOUND",
	"NO_COMPANY",
	"UNIT_NOT_FOUND",
	"COURIER_UNIT_REQUIRED",
]);

export const StaffErrorsStatusCodes: Record<keyof typeof StaffErrors, StatusCodes> = {
	COURIER_UNIT_REQUIRED: StatusCodes.UNPROCESSABLE_ENTITY,
	EMAIL_TAKEN: StatusCodes.CONFLICT,
	NO_COMPANY: StatusCodes.BAD_REQUEST,
	STAFF_NOT_FOUND: StatusCodes.NOT_FOUND,
	UNIT_NOT_FOUND: StatusCodes.NOT_FOUND,
};
