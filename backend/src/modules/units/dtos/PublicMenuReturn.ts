import { t } from "elysia";

/** A single orderable item in a unit's storefront menu, with the per-unit price resolved. */
export const PublicMenuItemReturn = t.Object({
	cashbackPercent: t.Nullable(t.Number()),
	description: t.String(),
	id: t.String(),
	imageUrl: t.String(),
	priceCents: t.Integer(),
	productId: t.String(),
	title: t.String(),
});
export type PublicMenuItemReturn = typeof PublicMenuItemReturn.static;

/** A menu section: a category (or the loose group when `categoryId` is null) plus its items. */
export const PublicMenuSectionReturn = t.Object({
	categoryId: t.Nullable(t.String()),
	categoryName: t.Nullable(t.String()),
	items: t.Array(PublicMenuItemReturn),
});
export type PublicMenuSectionReturn = typeof PublicMenuSectionReturn.static;

export const PublicMenuReturn = t.Array(PublicMenuSectionReturn);
export type PublicMenuReturn = typeof PublicMenuReturn.static;
