import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const OrderErrors = createEnumFromArray([
	"CANCEL_REASON_REQUIRED",
	"COMPANY_NOT_FOUND",
	"DELIVERY_ADDRESS_REQUIRED",
	"CUSTOMER_NOT_FOUND",
	"EMPTY_ORDER",
	"INVALID_ITEM",
	"INVALID_OPTIONS",
	"INVALID_TRANSITION",
	"ORDER_NOT_FOUND",
	"UNIT_NOT_FOUND",
]);

export const OrderErrorsStatusCodes: Record<keyof typeof OrderErrors, StatusCodes> = {
	CANCEL_REASON_REQUIRED: StatusCodes.BAD_REQUEST,
	COMPANY_NOT_FOUND: StatusCodes.NOT_FOUND,
	CUSTOMER_NOT_FOUND: StatusCodes.NOT_FOUND,
	DELIVERY_ADDRESS_REQUIRED: StatusCodes.BAD_REQUEST,
	EMPTY_ORDER: StatusCodes.BAD_REQUEST,
	INVALID_ITEM: StatusCodes.BAD_REQUEST,
	INVALID_OPTIONS: StatusCodes.UNPROCESSABLE_ENTITY,
	INVALID_TRANSITION: StatusCodes.UNPROCESSABLE_ENTITY,
	ORDER_NOT_FOUND: StatusCodes.NOT_FOUND,
	UNIT_NOT_FOUND: StatusCodes.NOT_FOUND,
};
