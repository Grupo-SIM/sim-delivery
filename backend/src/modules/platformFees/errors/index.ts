import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const PlatformFeeErrors = createEnumFromArray([
	"FEES_BELOW_ACQUIRER_COST",
]);

export const PlatformFeeErrorsStatusCodes: Record<keyof typeof PlatformFeeErrors, StatusCodes> = {
	FEES_BELOW_ACQUIRER_COST: StatusCodes.UNPROCESSABLE_ENTITY,
};
