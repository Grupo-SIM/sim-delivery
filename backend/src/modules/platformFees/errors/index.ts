import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const PlatformFeeErrors = createEnumFromArray([
	"COMPANY_NOT_FOUND_FOR_FEES",
	"FEES_BELOW_ACQUIRER_COST",
	"INVALID_PLATFORM_FEE",
	"PLATFORM_FEE_NOT_FOUND",
]);

export const PlatformFeeErrorsStatusCodes: Record<keyof typeof PlatformFeeErrors, StatusCodes> = {
	COMPANY_NOT_FOUND_FOR_FEES: StatusCodes.NOT_FOUND,
	FEES_BELOW_ACQUIRER_COST: StatusCodes.UNPROCESSABLE_ENTITY,
	INVALID_PLATFORM_FEE: StatusCodes.BAD_REQUEST,
	PLATFORM_FEE_NOT_FOUND: StatusCodes.NOT_FOUND,
};
