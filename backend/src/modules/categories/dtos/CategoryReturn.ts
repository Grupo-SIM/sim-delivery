import { t } from "elysia";
import { CategoryPlain } from "sql/typebox";

/** Public shape of a category, reused across category endpoints. */
const AssociatedProductReturn = t.Object({ id: t.String(), title: t.String() });
export const CategoryReturn = t.Object({
	...CategoryPlain.properties,
	products: t.Array(AssociatedProductReturn),
});
export type CategoryReturn = typeof CategoryReturn.static;

export const CategoryListReturn = t.Array(CategoryReturn);
export type CategoryListReturn = typeof CategoryListReturn.static;
