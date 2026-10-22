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

export const WhatsAppAttachment = t.Object({
	filename: t.String({ maxLength: 255, minLength: 1 }),
	mimeType: t.Union([
		t.Literal("application/pdf"),
		t.Literal("image/jpeg"),
		t.Literal("image/png"),
		t.Literal("image/webp"),
	]),
	url: t.String({ format: "uri", maxLength: 1000 }),
});
export type WhatsAppAttachment = typeof WhatsAppAttachment.static;

export const OrderStatusWhatsAppTemplate = t.Object({
	attachments: t.Optional(t.Array(WhatsAppAttachment, { maxItems: 3 })),
	message: t.Optional(t.String({ maxLength: 1000 })),
});
export type OrderStatusWhatsAppTemplate = typeof OrderStatusWhatsAppTemplate.static;

export const OrderStatusWhatsAppTemplates = t.Object({
	cancelado: t.Optional(OrderStatusWhatsAppTemplate),
	em_preparo: t.Optional(OrderStatusWhatsAppTemplate),
	entregue: t.Optional(OrderStatusWhatsAppTemplate),
	pronto: t.Optional(OrderStatusWhatsAppTemplate),
	recebido: t.Optional(OrderStatusWhatsAppTemplate),
	retirado: t.Optional(OrderStatusWhatsAppTemplate),
	saiu_para_entrega: t.Optional(OrderStatusWhatsAppTemplate),
});
export type OrderStatusWhatsAppTemplates = typeof OrderStatusWhatsAppTemplates.static;

export const OrderStatusEmailTemplate = t.Object({
	message: t.Optional(t.String({ maxLength: 1000 })),
	subtitle: t.Optional(t.String({ maxLength: 200 })),
	title: t.Optional(t.String({ maxLength: 200 })),
});
export type OrderStatusEmailTemplate = typeof OrderStatusEmailTemplate.static;

export const OrderStatusEmailTemplates = t.Object({
	cancelado: t.Optional(OrderStatusEmailTemplate),
	em_preparo: t.Optional(OrderStatusEmailTemplate),
	entregue: t.Optional(OrderStatusEmailTemplate),
	pronto: t.Optional(OrderStatusEmailTemplate),
	recebido: t.Optional(OrderStatusEmailTemplate),
	retirado: t.Optional(OrderStatusEmailTemplate),
	saiu_para_entrega: t.Optional(OrderStatusEmailTemplate),
});
export type OrderStatusEmailTemplates = typeof OrderStatusEmailTemplates.static;

export const ThemeMode = t.Union([t.Literal("dark"), t.Literal("light")]);
export type ThemeMode = typeof ThemeMode.static;

export const UpdateBrandingBody = t.Object({
	welcomeEyebrow: t.Optional(t.String({ maxLength: 100 })),
	welcomeDescription: t.Optional(t.String({ maxLength: 500 })),
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
	homepageBannerUrls: t.Optional(t.Array(t.String({ format: "uri", maxLength: 1000 }), { maxItems: 10 })),
	logoUrl: t.Optional(t.String({ format: "uri", maxLength: 1000 })),
	metaPixelId: t.Optional(t.String({ maxLength: 50 })),
	mobileIconUrl: t.Optional(t.String({ format: "uri", maxLength: 1000 })),
	orderStatusEmailTemplates: t.Optional(OrderStatusEmailTemplates),
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
