import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const PaymentErrors = createEnumFromArray([
	"CARD_DECLINED",
	"CARD_REQUIRED",
	"DOCUMENT_REQUIRED",
	"INVALID_DOCUMENT",
	"ORDER_NOT_FOUND",
	"PAYMENT_NOT_FOUND",
	"PAYMENT_ALREADY_CONFIRMED",
	"PIX_FAILED",
	"SAVED_CARD_NOT_FOUND",
	"UNAUTHORIZED_ORDER",
]);

export const PaymentErrorsStatusCodes: Record<keyof typeof PaymentErrors, StatusCodes> = {
	CARD_DECLINED: StatusCodes.UNPROCESSABLE_ENTITY,
	CARD_REQUIRED: StatusCodes.BAD_REQUEST,
	DOCUMENT_REQUIRED: StatusCodes.BAD_REQUEST,
	INVALID_DOCUMENT: StatusCodes.UNPROCESSABLE_ENTITY,
	ORDER_NOT_FOUND: StatusCodes.NOT_FOUND,
	PAYMENT_ALREADY_CONFIRMED: StatusCodes.CONFLICT,
	PAYMENT_NOT_FOUND: StatusCodes.NOT_FOUND,
	PIX_FAILED: StatusCodes.UNPROCESSABLE_ENTITY,
	SAVED_CARD_NOT_FOUND: StatusCodes.NOT_FOUND,
	UNAUTHORIZED_ORDER: StatusCodes.FORBIDDEN,
};
