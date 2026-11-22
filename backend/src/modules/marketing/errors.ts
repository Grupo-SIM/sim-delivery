import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const MarketingErrors = createEnumFromArray([
	"UTM_LINK_NOT_FOUND",
	"UTM_LINK_PATH_TAKEN",
	"UTM_LINK_INVALID_PATH",
	"UTM_LINK_EMPTY",
]);

export const MarketingErrorsStatusCodes: Record<keyof typeof MarketingErrors, StatusCodes> = {
	UTM_LINK_EMPTY: StatusCodes.UNPROCESSABLE_ENTITY,
	UTM_LINK_INVALID_PATH: StatusCodes.UNPROCESSABLE_ENTITY,
	UTM_LINK_NOT_FOUND: StatusCodes.NOT_FOUND,
	UTM_LINK_PATH_TAKEN: StatusCodes.CONFLICT,
};
