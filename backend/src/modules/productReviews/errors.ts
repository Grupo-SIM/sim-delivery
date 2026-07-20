import { StatusCodes } from "http-status-codes";

export const ProductReviewErrors = {
	ALREADY_REVIEWED: "ALREADY_REVIEWED",
	INVALID_RATING: "INVALID_RATING",
	ORDER_NOT_ELIGIBLE: "ORDER_NOT_ELIGIBLE",
	ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
	PRODUCT_NOT_IN_ORDER: "PRODUCT_NOT_IN_ORDER",
} as const;

export const ProductReviewErrorsStatusCodes: Record<keyof typeof ProductReviewErrors, StatusCodes> = {
	ALREADY_REVIEWED: StatusCodes.CONFLICT,
	INVALID_RATING: StatusCodes.UNPROCESSABLE_ENTITY,
	ORDER_NOT_ELIGIBLE: StatusCodes.UNPROCESSABLE_ENTITY,
	ORDER_NOT_FOUND: StatusCodes.NOT_FOUND,
	PRODUCT_NOT_IN_ORDER: StatusCodes.UNPROCESSABLE_ENTITY,
};
