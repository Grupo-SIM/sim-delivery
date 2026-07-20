import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const PromotionalImageErrors = createEnumFromArray(["PROMOTIONAL_IMAGE_NOT_FOUND", "NO_COMPANY"]);

export const PromotionalImageErrorsStatusCodes: Record<keyof typeof PromotionalImageErrors, StatusCodes> = {
	NO_COMPANY: StatusCodes.BAD_REQUEST,
	PROMOTIONAL_IMAGE_NOT_FOUND: StatusCodes.NOT_FOUND,
};
