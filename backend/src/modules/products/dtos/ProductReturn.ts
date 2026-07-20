import { t } from "elysia";
import { ProductPlain } from "sql/typebox";

const ProductCategorySummary = t.Object({ id: t.String(), name: t.String(), position: t.Integer() });
const ProductTagSummary = t.Object({ color: t.String(), id: t.String(), name: t.String() });

export const ProductReturn = t.Object({
	...ProductPlain.properties,
	categories: t.Array(ProductCategorySummary),
	optionGroupCount: t.Integer(),
	tags: t.Array(ProductTagSummary),
});
export type ProductReturn = typeof ProductReturn.static;

export const ProductListReturn = t.Array(ProductReturn);
export type ProductListReturn = typeof ProductListReturn.static;
