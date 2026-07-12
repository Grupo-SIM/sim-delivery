import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const DeliveryErrors = createEnumFromArray([
	"DELIVERY_NOT_FOUND",
	"FORBIDDEN_COURIER",
	"INVALID_TRANSITION",
	"ORDER_NOT_DELIVERY",
	"ORDER_NOT_FOUND",
	"ORDER_ALREADY_ASSIGNED",
]);

export const DeliveryErrorsStatusCodes: Record<keyof typeof DeliveryErrors, StatusCodes> = {
	DELIVERY_NOT_FOUND: StatusCodes.NOT_FOUND,
	FORBIDDEN_COURIER: StatusCodes.FORBIDDEN,
	INVALID_TRANSITION: StatusCodes.UNPROCESSABLE_ENTITY,
	ORDER_ALREADY_ASSIGNED: StatusCodes.CONFLICT,
	ORDER_NOT_DELIVERY: StatusCodes.BAD_REQUEST,
	ORDER_NOT_FOUND: StatusCodes.NOT_FOUND,
};
