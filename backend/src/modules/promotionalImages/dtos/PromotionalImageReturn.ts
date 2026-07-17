import { t } from "elysia";

export const PromotionalImageReturn = t.Object({
	id: t.String(),
	imageUrl: t.String(),
	linkUrl: t.Nullable(t.String()),
	title: t.String(),
});
export type PromotionalImageReturn = typeof PromotionalImageReturn.static;

export const PromotionalImageListReturn = t.Array(PromotionalImageReturn);
export type PromotionalImageListReturn = typeof PromotionalImageListReturn.static;

export const PromotionalImageUnitsReturn = t.Array(t.String());
export type PromotionalImageUnitsReturn = typeof PromotionalImageUnitsReturn.static;
