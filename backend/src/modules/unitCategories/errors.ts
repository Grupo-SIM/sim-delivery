import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const UnitCategoryErrors = createEnumFromArray(["UNIT_CATEGORY_NOT_LINKED"]);

export const UnitCategoryErrorsStatusCodes: Record<keyof typeof UnitCategoryErrors, StatusCodes> = {
	UNIT_CATEGORY_NOT_LINKED: StatusCodes.BAD_REQUEST,
};
