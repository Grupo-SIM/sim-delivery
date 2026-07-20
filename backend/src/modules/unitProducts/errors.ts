import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const UnitProductErrors = createEnumFromArray([
	"INVALID_EXCLUDED_OPTION",
	"UNIT_PRODUCT_NOT_FOUND",
	"UNIT_PRODUCT_EXISTS",
]);

export const UnitProductErrorsStatusCodes: Record<keyof typeof UnitProductErrors, StatusCodes> = {
	INVALID_EXCLUDED_OPTION: StatusCodes.UNPROCESSABLE_ENTITY,
	UNIT_PRODUCT_EXISTS: StatusCodes.CONFLICT,
	UNIT_PRODUCT_NOT_FOUND: StatusCodes.NOT_FOUND,
};
