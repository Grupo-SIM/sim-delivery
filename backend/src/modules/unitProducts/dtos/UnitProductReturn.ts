import { t } from "elysia";
import { UnitProductPlain } from "sql/typebox";

/** Public shape of a unit↔product association. The admin UI joins it with the already
 * loaded products/categories client-side, so the flat plain shape is enough. */
export const UnitProductReturn = t.Object({
	...UnitProductPlain.properties,
	additionalOptions: t.Array(
		t.Object({
			available: t.Boolean(),
			description: t.String(),
			groupId: t.String(),
			id: t.String(),
			imageUrl: t.Nullable(t.String()),
			maxPerItem: t.Nullable(t.Integer()),
			name: t.String(),
			priceDeltaCents: t.Integer(),
			sortOrder: t.Integer(),
		}),
	),
	categoryIds: t.Array(t.String()),
	excludedOptionIds: t.Array(t.String()),
	optionOverrides: t.Array(
		t.Object({
			available: t.Nullable(t.Boolean()),
			description: t.Nullable(t.String()),
			imageUrl: t.Nullable(t.String()),
			maxPerItem: t.Nullable(t.Integer()),
			name: t.Nullable(t.String()),
			optionId: t.String(),
			priceDeltaCents: t.Nullable(t.Integer()),
			sortOrder: t.Nullable(t.Integer()),
		}),
	),
	tagIds: t.Array(t.String()),
});
export type UnitProductReturn = typeof UnitProductReturn.static;

export const UnitProductListReturn = t.Array(UnitProductReturn);
export type UnitProductListReturn = typeof UnitProductListReturn.static;
