import { StatusCodes } from "http-status-codes";

export const ReviewErrors = {
	ALREADY_REVIEWED: "ALREADY_REVIEWED",
	INVALID_RATING: "INVALID_RATING",
	ORDER_NOT_ELIGIBLE: "ORDER_NOT_ELIGIBLE",
	ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
	REVIEW_NOT_FOUND: "REVIEW_NOT_FOUND",
} as const;

export const ReviewErrorsStatusCodes: Record<keyof typeof ReviewErrors, StatusCodes> = {
	ALREADY_REVIEWED: StatusCodes.CONFLICT,
	INVALID_RATING: StatusCodes.UNPROCESSABLE_ENTITY,
	ORDER_NOT_ELIGIBLE: StatusCodes.UNPROCESSABLE_ENTITY,
	ORDER_NOT_FOUND: StatusCodes.NOT_FOUND,
	REVIEW_NOT_FOUND: StatusCodes.NOT_FOUND,
};
