import { t } from "elysia";

export const GetBrandingQuery = t.Object({
	slug: t.Optional(t.String({ minLength: 1 })),
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

export const OrderStatusWhatsAppTemplates = t.Object({
	em_preparo: t.Optional(t.String({ maxLength: 1000 })),
	entregue: t.Optional(t.String({ maxLength: 1000 })),
	retirado: t.Optional(t.String({ maxLength: 1000 })),
	saiu_para_entrega: t.Optional(t.String({ maxLength: 1000 })),
});
export type OrderStatusWhatsAppTemplates = typeof OrderStatusWhatsAppTemplates.static;

export const ThemeMode = t.Union([t.Literal("dark"), t.Literal("light")]);
export type ThemeMode = typeof ThemeMode.static;

export const UpdateBrandingBody = t.Object({
	allowThemeToggle: t.Optional(t.Boolean()),
	defaultTheme: t.Optional(ThemeMode),
	fontDisplay: t.Optional(t.String({ maxLength: 100 })),
	fontDisplayUrl: t.Optional(t.String({ format: "uri", maxLength: 1000 })),
	fontFamily: t.Optional(t.String({ maxLength: 100 })),
	fontFamilyUrl: t.Optional(t.String({ format: "uri", maxLength: 1000 })),
	footerFacebookUrl: t.Optional(t.String({ format: "uri", maxLength: 1000 })),
	footerInstagramUrl: t.Optional(t.String({ format: "uri", maxLength: 1000 })),
	footerPaymentMethods: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 10 })),
	footerSupportEmail: t.Optional(t.String({ format: "email", maxLength: 320 })),
	footerText: t.Optional(t.String({ maxLength: 500 })),
	footerWhatsApp: t.Optional(t.String({ maxLength: 30 })),
	ga4Id: t.Optional(t.String({ maxLength: 50 })),
	gtmId: t.Optional(t.String({ maxLength: 50 })),
	logoUrl: t.Optional(t.String({ format: "uri", maxLength: 1000 })),
	metaPixelId: t.Optional(t.String({ maxLength: 50 })),
	mobileIconUrl: t.Optional(t.String({ format: "uri", maxLength: 1000 })),
	orderStatusWhatsAppTemplates: t.Optional(OrderStatusWhatsAppTemplates),
	themeColors: t.Optional(ThemeColors),
	unitFallbackImageUrl: t.Optional(t.String({ format: "uri", maxLength: 1000 })),
});
export type UpdateBrandingBody = typeof UpdateBrandingBody.static;

export const UpdateBrandingDTO = t.Object({
	...UpdateBrandingBody.properties,
	companyId: t.String(),
});
export type UpdateBrandingDTO = typeof UpdateBrandingDTO.static;
