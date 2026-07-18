import { t } from "elysia";

/** The category currently applied to a product (across whichever units it's assigned to). */
export const ProductCategoryReturn = t.Object({ categoryId: t.Nullable(t.String()) });
export type ProductCategoryReturn = typeof ProductCategoryReturn.static;
