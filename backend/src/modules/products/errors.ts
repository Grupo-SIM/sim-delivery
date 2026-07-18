import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const ProductErrors = createEnumFromArray(["INVALID_OPTION_GROUP", "INVALID_OPTION_RULES", "PRODUCT_NOT_FOUND", "NO_COMPANY"]);

export const ProductErrorsStatusCodes: Record<keyof typeof ProductErrors, StatusCodes> = {
	INVALID_OPTION_GROUP: StatusCodes.NOT_FOUND,
	INVALID_OPTION_RULES: StatusCodes.UNPROCESSABLE_ENTITY,
	NO_COMPANY: StatusCodes.BAD_REQUEST,
	PRODUCT_NOT_FOUND: StatusCodes.NOT_FOUND,
};
