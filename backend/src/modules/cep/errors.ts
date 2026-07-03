import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const CepErrors = createEnumFromArray(["INVALID_CEP", "CEP_NOT_FOUND"]);

export const CepErrorsStatusCodes: Record<keyof typeof CepErrors, StatusCodes> = {
	CEP_NOT_FOUND: StatusCodes.NOT_FOUND,
	INVALID_CEP: StatusCodes.BAD_REQUEST,
};
