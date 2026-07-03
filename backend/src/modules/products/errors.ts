import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const ProductErrors = createEnumFromArray(["PRODUCT_NOT_FOUND", "NO_COMPANY"]);

export const ProductErrorsStatusCodes: Record<keyof typeof ProductErrors, StatusCodes> = {
	NO_COMPANY: StatusCodes.BAD_REQUEST,
	PRODUCT_NOT_FOUND: StatusCodes.NOT_FOUND,
};
