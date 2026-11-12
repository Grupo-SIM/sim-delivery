import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const DiscountErrors = createEnumFromArray([
	"DISCOUNT_NOT_FOUND",
	"INVALID_DISCOUNT_VALUE",
	"INVALID_DISCOUNT_PERIOD",
	"NO_COMPANY",
]);

export const DiscountErrorsStatusCodes: Record<keyof typeof DiscountErrors, StatusCodes> = {
	DISCOUNT_NOT_FOUND: StatusCodes.NOT_FOUND,
	INVALID_DISCOUNT_PERIOD: StatusCodes.UNPROCESSABLE_ENTITY,
	INVALID_DISCOUNT_VALUE: StatusCodes.UNPROCESSABLE_ENTITY,
	NO_COMPANY: StatusCodes.BAD_REQUEST,
};
