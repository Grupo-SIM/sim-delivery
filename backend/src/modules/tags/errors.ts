import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const TagErrors = createEnumFromArray(["TAG_NOT_FOUND", "NO_COMPANY"]);

export const TagErrorsStatusCodes: Record<keyof typeof TagErrors, StatusCodes> = {
	TAG_NOT_FOUND: StatusCodes.NOT_FOUND,
	NO_COMPANY: StatusCodes.BAD_REQUEST,
};
