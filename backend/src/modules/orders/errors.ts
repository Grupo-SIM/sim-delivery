import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const OrderErrors = createEnumFromArray([
	"COMPANY_NOT_FOUND",
	"UNIT_NOT_FOUND",
	"CUSTOMER_NOT_FOUND",
	"EMPTY_ORDER",
	"INVALID_ITEM",
]);

export const OrderErrorsStatusCodes: Record<keyof typeof OrderErrors, StatusCodes> = {
	COMPANY_NOT_FOUND: StatusCodes.NOT_FOUND,
	CUSTOMER_NOT_FOUND: StatusCodes.NOT_FOUND,
	EMPTY_ORDER: StatusCodes.BAD_REQUEST,
	INVALID_ITEM: StatusCodes.BAD_REQUEST,
	UNIT_NOT_FOUND: StatusCodes.NOT_FOUND,
};
