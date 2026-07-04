import { t } from "elysia";

/** Customer-facing shape of a unit: only the fields the storefront needs (docs/04, docs/08). */
export const PublicUnitReturn = t.Object({
	addressLine: t.Nullable(t.String()),
	city: t.Nullable(t.String()),
	deliveryFee: t.Integer(),
	deliveryMethods: t.Array(t.String()),
	id: t.String(),
	isOpenNow: t.Boolean(),
	name: t.String(),
	neighborhood: t.Nullable(t.String()),
	phone: t.Nullable(t.String()),
});
export type PublicUnitReturn = typeof PublicUnitReturn.static;

export const PublicUnitListReturn = t.Array(PublicUnitReturn);
export type PublicUnitListReturn = typeof PublicUnitListReturn.static;
