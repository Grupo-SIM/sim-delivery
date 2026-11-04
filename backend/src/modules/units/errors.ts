import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const UnitErrors = createEnumFromArray([
	"UNIT_NOT_FOUND",
	"INVALID_BANNER_PRODUCT",
	"NO_COMPANY",
	"DUPLICATE_ZONE_RADIUS",
	"OUT_OF_DELIVERY_RANGE",
	"WHATSAPP_NOT_CONFIGURED",
	"WHATSAPP_SESSION_CONFLICT",
	"WHATSAPP_UNAVAILABLE",
]);

export const UnitErrorsStatusCodes: Record<keyof typeof UnitErrors, StatusCodes> = {
	DUPLICATE_ZONE_RADIUS: StatusCodes.BAD_REQUEST,
	INVALID_BANNER_PRODUCT: StatusCodes.BAD_REQUEST,
	NO_COMPANY: StatusCodes.BAD_REQUEST,
	OUT_OF_DELIVERY_RANGE: StatusCodes.UNPROCESSABLE_ENTITY,
	UNIT_NOT_FOUND: StatusCodes.NOT_FOUND,
	WHATSAPP_NOT_CONFIGURED: StatusCodes.NOT_FOUND,
	WHATSAPP_SESSION_CONFLICT: StatusCodes.CONFLICT,
	WHATSAPP_UNAVAILABLE: StatusCodes.BAD_GATEWAY,
};
