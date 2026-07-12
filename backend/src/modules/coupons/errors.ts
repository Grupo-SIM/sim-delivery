import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const CouponErrors = createEnumFromArray([
	"COMPANY_NOT_FOUND",
	"COUPON_NOT_FOUND",
	"COUPON_EXPIRED",
	"COUPON_EXHAUSTED",
	"ORDER_TOO_SMALL",
]);

export const CouponErrorsStatusCodes: Record<keyof typeof CouponErrors, StatusCodes> = {
	COMPANY_NOT_FOUND: StatusCodes.NOT_FOUND,
	COUPON_EXHAUSTED: StatusCodes.UNPROCESSABLE_ENTITY,
	COUPON_EXPIRED: StatusCodes.UNPROCESSABLE_ENTITY,
	COUPON_NOT_FOUND: StatusCodes.NOT_FOUND,
	ORDER_TOO_SMALL: StatusCodes.UNPROCESSABLE_ENTITY,
};
