import { t } from "elysia";

export const MediaGalleryQuery = t.Object({
	cursor: t.Optional(t.String()),
	limit: t.Optional(t.Numeric({ maximum: 60, minimum: 1 })),
	search: t.Optional(t.String({ maxLength: 100 })),
});
export type MediaGalleryQuery = typeof MediaGalleryQuery.static;

/** Kinds of record that reference an image; the frontend translates each through `media.gallery.entity.<type>`. */
export const MediaUsageType = t.Union([
	t.Literal("category"),
	t.Literal("companyLogo"),
	t.Literal("companyMobileIcon"),
	t.Literal("companyUnitFallback"),
	t.Literal("option"),
	t.Literal("product"),
	t.Literal("promotion"),
	t.Literal("unit"),
	t.Literal("unitBanner"),
	t.Literal("unitOption"),
	t.Literal("unitProduct"),
]);

export const MediaGalleryItemReturn = t.Object({
	createdAt: t.String({ format: "date-time" }),
	id: t.String(),
	lastUsedAt: t.String({ format: "date-time" }),
	url: t.String(),
	usedBy: t.Array(t.Object({ context: t.Nullable(t.String()), name: t.String(), type: MediaUsageType })),
});
export type MediaGalleryItemReturn = typeof MediaGalleryItemReturn.static;

export const MediaGalleryReturn = t.Object({
	items: t.Array(MediaGalleryItemReturn),
	nextCursor: t.Nullable(t.String()),
});
export type MediaGalleryReturn = typeof MediaGalleryReturn.static;
