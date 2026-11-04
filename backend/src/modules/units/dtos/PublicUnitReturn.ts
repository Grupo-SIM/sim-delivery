import { t } from "elysia";
import { PromotionalImageReturn } from "@/modules/promotionalImages/dtos";
import { EffectiveFeeReturn } from "@/modules/platformFees/dtos";

const PublicUnitHoursReturn = t.Object({
	closed: t.Boolean(),
	closesAt: t.Nullable(t.String()),
	opensAt: t.Nullable(t.String()),
	weekday: t.Integer({ maximum: 6, minimum: 0 }),
});

/** Customer-facing shape of a unit: only the fields the storefront needs (docs/04, docs/08). */
export const PublicUnitReturn = t.Object({
	addressLine: t.Nullable(t.String()),
	bannerProductIds: t.Array(t.String()),
	bannerUrls: t.Array(t.String()),
	city: t.Nullable(t.String()),
	deliveryFee: t.Integer(),
	deliveryMethods: t.Array(t.String()),
	facebookUrl: t.Nullable(t.String()),
	fees: t.Array(EffectiveFeeReturn),
	hours: t.Array(PublicUnitHoursReturn),
	id: t.String(),
	imageUrl: t.Nullable(t.String()),
	instagramUrl: t.Nullable(t.String()),
	isOpenNow: t.Boolean(),
	minOrderCents: t.Integer(),
	name: t.String(),
	neighborhood: t.Nullable(t.String()),
	phone: t.Nullable(t.String()),
	prepTimeMaxMinutes: t.Nullable(t.Integer()),
	prepTimeMinMinutes: t.Nullable(t.Integer()),
	promotionalImages: t.Array(PromotionalImageReturn),
	ratingAverage: t.Nullable(t.Number()),
	ratingCount: t.Integer(),
	slug: t.String(),
	whatsApp: t.Nullable(t.String()),
	xUrl: t.Nullable(t.String()),
});
export type PublicUnitReturn = typeof PublicUnitReturn.static;

export const PublicUnitListReturn = t.Array(PublicUnitReturn);
export type PublicUnitListReturn = typeof PublicUnitListReturn.static;
