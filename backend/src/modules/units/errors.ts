import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const UnitErrors = createEnumFromArray(["UNIT_NOT_FOUND", "NO_COMPANY"]);

export const UnitErrorsStatusCodes: Record<keyof typeof UnitErrors, StatusCodes> = {
	NO_COMPANY: StatusCodes.BAD_REQUEST,
	UNIT_NOT_FOUND: StatusCodes.NOT_FOUND,
};
