import { t } from "elysia";

export const GetBrandingQuery = t.Object({
	slug: t.Optional(t.String()),
	unitId: t.Optional(t.String()),
});
export type GetBrandingQuery = typeof GetBrandingQuery.static;

const HexColor = t.String({ pattern: "^#[0-9a-fA-F]{6}$" });

const ThemeColorSet = t.Object({
	accent: HexColor,
	accentForeground: HexColor,
	background: HexColor,
	border: HexColor,
	card: HexColor,
	cardForeground: HexColor,
	destructive: HexColor,
	foreground: HexColor,
	input: HexColor,
	muted: HexColor,
	mutedForeground: HexColor,
	popover: HexColor,
	popoverForeground: HexColor,
	primary: HexColor,
	primaryForeground: HexColor,
	ring: HexColor,
	secondary: HexColor,
	secondaryForeground: HexColor,
	success: HexColor,
	surfaceSunken: HexColor,
	warning: HexColor,
});

export const ThemeColors = t.Object({ dark: ThemeColorSet, light: ThemeColorSet });
export type ThemeColors = typeof ThemeColors.static;

export const UpdateBrandingBody = t.Object({
	footerText: t.Optional(t.String({ maxLength: 500 })),
	ga4Id: t.Optional(t.String({ maxLength: 50 })),
	gtmId: t.Optional(t.String({ maxLength: 50 })),
	logoUrl: t.Optional(t.String({ format: "uri", maxLength: 1000 })),
	metaPixelId: t.Optional(t.String({ maxLength: 50 })),
	themeColors: t.Optional(ThemeColors),
});
export type UpdateBrandingBody = typeof UpdateBrandingBody.static;

export const UpdateBrandingDTO = t.Object({
	...UpdateBrandingBody.properties,
	companyId: t.String(),
});
export type UpdateBrandingDTO = typeof UpdateBrandingDTO.static;
