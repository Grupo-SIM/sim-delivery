import { t } from "elysia";
import { CategoryPlain } from "sql/typebox";

/** Public shape of a category, reused across category endpoints. */
export const CategoryReturn = CategoryPlain;
export type CategoryReturn = typeof CategoryReturn.static;

export const CategoryListReturn = t.Array(CategoryReturn);
export type CategoryListReturn = typeof CategoryListReturn.static;
