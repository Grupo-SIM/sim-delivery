import { t } from "elysia";

/** A category as it appears in a unit's ordered admin category list. */
export const UnitCategoryReturn = t.Object({
	id: t.String(),
	imageUrl: t.String(),
	name: t.String(),
	position: t.Integer(),
});
export type UnitCategoryReturn = typeof UnitCategoryReturn.static;

export const UnitCategoriesReturn = t.Array(UnitCategoryReturn);
export type UnitCategoriesReturn = typeof UnitCategoriesReturn.static;
