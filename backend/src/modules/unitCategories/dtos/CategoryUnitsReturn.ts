import { t } from "elysia";

/** The ids of the units a category is currently assigned to. */
export const CategoryUnitsReturn = t.Array(t.String());
export type CategoryUnitsReturn = typeof CategoryUnitsReturn.static;
