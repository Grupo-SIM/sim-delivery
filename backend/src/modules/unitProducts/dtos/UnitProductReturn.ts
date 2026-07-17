import { t } from "elysia";
import { UnitProductPlain } from "sql/typebox";

/** Public shape of a unit↔product association. The admin UI joins it with the already
 * loaded products/categories client-side, so the flat plain shape is enough. */
export const UnitProductReturn = t.Object({
	...UnitProductPlain.properties,
	categoryIds: t.Array(t.String()),
	tagIds: t.Array(t.String()),
});
export type UnitProductReturn = typeof UnitProductReturn.static;

export const UnitProductListReturn = t.Array(UnitProductReturn);
export type UnitProductListReturn = typeof UnitProductListReturn.static;
