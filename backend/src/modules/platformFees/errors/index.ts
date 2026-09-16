import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const PlatformFeeErrors = createEnumFromArray([
	"INVALID_PLATFORM_FEE",
	"PLATFORM_FEE_NOT_FOUND",
]);

export const PlatformFeeErrorsStatusCodes: Record<keyof typeof PlatformFeeErrors, StatusCodes> = {
	INVALID_PLATFORM_FEE: StatusCodes.BAD_REQUEST,
	PLATFORM_FEE_NOT_FOUND: StatusCodes.NOT_FOUND,
};
