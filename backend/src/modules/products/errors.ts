import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const ProductErrors = createEnumFromArray([
	"INVALID_OPTION_GROUP",
	"PRODUCT_ALREADY_EXISTS",
	"PRODUCT_NOT_FOUND",
	"NO_COMPANY",
]);

export const ProductErrorsStatusCodes: Record<keyof typeof ProductErrors, StatusCodes> = {
	INVALID_OPTION_GROUP: StatusCodes.NOT_FOUND,
	NO_COMPANY: StatusCodes.BAD_REQUEST,
	PRODUCT_ALREADY_EXISTS: StatusCodes.CONFLICT,
	PRODUCT_NOT_FOUND: StatusCodes.NOT_FOUND,
};
