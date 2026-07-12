import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const TagErrors = createEnumFromArray(["TAG_NOT_FOUND", "NO_COMPANY"]);

export const TagErrorsStatusCodes: Record<keyof typeof TagErrors, StatusCodes> = {
	NO_COMPANY: StatusCodes.BAD_REQUEST,
	TAG_NOT_FOUND: StatusCodes.NOT_FOUND,
};
