import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const CategoryErrors = createEnumFromArray(["CATEGORY_NOT_FOUND", "NO_COMPANY"]);

export const CategoryErrorsStatusCodes: Record<keyof typeof CategoryErrors, StatusCodes> = {
	CATEGORY_NOT_FOUND: StatusCodes.NOT_FOUND,
	NO_COMPANY: StatusCodes.BAD_REQUEST,
};
