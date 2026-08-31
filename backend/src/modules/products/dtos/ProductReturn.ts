import { t } from "elysia";
import { ProductPlain } from "sql/typebox";

const ProductCategorySummary = t.Object({ id: t.String(), name: t.String(), position: t.Integer() });
const ProductOptionGroupPreview = t.Object({
	id: t.String(),
	name: t.String(),
	optionCount: t.Integer(),
});
const ProductTagSummary = t.Object({ color: t.String(), id: t.String(), name: t.String() });
const ProductUnitAvailability = t.Object({
	available: t.Boolean(),
	unitId: t.String(),
	unitProductId: t.String(),
});

export const ProductReturn = t.Object({
	...ProductPlain.properties,
	categories: t.Array(ProductCategorySummary),
	optionGroupCount: t.Integer(),
	optionGroups: t.Array(ProductOptionGroupPreview),
	tags: t.Array(ProductTagSummary),
	unitAvailability: t.Array(ProductUnitAvailability),
});
export type ProductReturn = typeof ProductReturn.static;

export const ProductListReturn = t.Array(ProductReturn);
export type ProductListReturn = typeof ProductListReturn.static;

export const UpdateProductAvailabilityReturn = t.Object({ updatedCount: t.Integer({ minimum: 0 }) });
export type UpdateProductAvailabilityReturn = typeof UpdateProductAvailabilityReturn.static;
