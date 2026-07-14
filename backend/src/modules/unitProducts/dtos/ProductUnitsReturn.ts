import { t } from "elysia";

/** The ids of the units a product is currently assigned to. */
export const ProductUnitsReturn = t.Array(t.String());
export type ProductUnitsReturn = typeof ProductUnitsReturn.static;
