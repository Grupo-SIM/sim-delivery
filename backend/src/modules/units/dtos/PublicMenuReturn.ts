import { t } from "elysia";

export const PublicOptionReturn = t.Object({
	description: t.String(),
	id: t.String(),
	imageUrl: t.Nullable(t.String()),
	maxPerItem: t.Nullable(t.Integer()),
	name: t.String(),
	popularity: t.Integer(),
	priceDeltaCents: t.Integer(),
});
export type PublicOptionReturn = typeof PublicOptionReturn.static;

export const PublicOptionGroupReturn = t.Object({
	allowRepeatSelection: t.Boolean(),
	id: t.String(),
	maxSelect: t.Nullable(t.Integer()),
	name: t.String(),
	options: t.Array(PublicOptionReturn),
	priceRule: t.String(),
	required: t.Boolean(),
	sortOrder: t.Integer(),
});
export type PublicOptionGroupReturn = typeof PublicOptionGroupReturn.static;

/** A single orderable item in a unit's storefront menu, with the per-unit price resolved. */
export const PublicMenuItemReturn = t.Object({
	cashbackPercent: t.Nullable(t.Number()),
	description: t.String(),
	featuredRank: t.Nullable(t.Integer()),
	fromPriceCents: t.Integer(),
	id: t.String(),
	imageUrl: t.String(),
	optionGroups: t.Array(PublicOptionGroupReturn),
	popularity: t.Integer(),
	priceCents: t.Integer(),
	productId: t.String(),
	productSlug: t.String(),
	ratingAverage: t.Nullable(t.Number()),
	ratingCount: t.Integer(),
	regularPriceCents: t.Integer(),
	tags: t.Array(t.Object({ color: t.String(), id: t.String(), name: t.String() })),
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
