import { createEnumFromArray } from "@hyoretsu/utils";
import { StatusCodes } from "http-status-codes";

export const InventoryErrors = createEnumFromArray([
	"INVENTORY_ENTRY_COST_REQUIRED",
	"INVENTORY_ITEM_NOT_FOUND",
	"INVENTORY_SCOPE_INVALID",
	"INVALID_RECIPE_OPTION",
	"LOCAL_OPTION_NOT_FOUND",
	"INSUFFICIENT_STOCK",
]);

export const InventoryErrorsStatusCodes: Record<keyof typeof InventoryErrors, StatusCodes> = {
	INSUFFICIENT_STOCK: StatusCodes.CONFLICT,
	INVALID_RECIPE_OPTION: StatusCodes.UNPROCESSABLE_ENTITY,
	INVENTORY_ENTRY_COST_REQUIRED: StatusCodes.UNPROCESSABLE_ENTITY,
	INVENTORY_ITEM_NOT_FOUND: StatusCodes.NOT_FOUND,
	INVENTORY_SCOPE_INVALID: StatusCodes.NOT_FOUND,
	LOCAL_OPTION_NOT_FOUND: StatusCodes.NOT_FOUND,
};
