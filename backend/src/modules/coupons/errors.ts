import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const CouponErrors = createEnumFromArray([
	"COMPANY_NOT_FOUND",
	"COUPON_NOT_FOUND",
	"COUPON_EXPIRED",
	"COUPON_EXHAUSTED",
	"ORDER_TOO_SMALL",
	"CODE_TAKEN",
	"NO_COMPANY",
]);

export const CouponErrorsStatusCodes: Record<keyof typeof CouponErrors, StatusCodes> = {
	CODE_TAKEN: StatusCodes.CONFLICT,
	COMPANY_NOT_FOUND: StatusCodes.NOT_FOUND,
	COUPON_EXHAUSTED: StatusCodes.UNPROCESSABLE_ENTITY,
	COUPON_EXPIRED: StatusCodes.UNPROCESSABLE_ENTITY,
	COUPON_NOT_FOUND: StatusCodes.NOT_FOUND,
	NO_COMPANY: StatusCodes.BAD_REQUEST,
	ORDER_TOO_SMALL: StatusCodes.UNPROCESSABLE_ENTITY,
};
