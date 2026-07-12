import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const PaymentErrors = createEnumFromArray([
	"ORDER_NOT_FOUND",
	"PAYMENT_NOT_FOUND",
	"PAYMENT_ALREADY_CONFIRMED",
	"UNAUTHORIZED_ORDER",
]);

export const PaymentErrorsStatusCodes: Record<keyof typeof PaymentErrors, StatusCodes> = {
	ORDER_NOT_FOUND: StatusCodes.NOT_FOUND,
	PAYMENT_ALREADY_CONFIRMED: StatusCodes.CONFLICT,
	PAYMENT_NOT_FOUND: StatusCodes.NOT_FOUND,
	UNAUTHORIZED_ORDER: StatusCodes.FORBIDDEN,
};
