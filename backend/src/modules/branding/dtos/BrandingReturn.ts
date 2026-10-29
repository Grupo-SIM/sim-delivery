import { t } from "elysia";
import { __nullable__ } from "sql/typebox";
import { OrderStatusEmailTemplates, OrderStatusWhatsAppTemplates, ThemeColors, ThemeMode } from "./BrandingInput";

export const BrandingReturn = t.Object({
    legalName: __nullable__(t.String()),
    cnpj: __nullable__(t.String()),
    address: __nullable__(t.String()),
    privacyContactEmail: __nullable__(t.String()),
    privacyContactPhone: __nullable__(t.String()),

	welcomeEyebrow: __nullable__(t.String()),
	welcomeTitle: __nullable__(t.String()),
	welcomeTitleAccent: __nullable__(t.String()),
	welcomeDescription: __nullable__(t.String()),
	allowThemeToggle: t.Boolean(),
	companyName: __nullable__(t.String()),
	defaultTheme: ThemeMode,
	fontDisplay: __nullable__(t.String()),
	fontDisplayUrl: __nullable__(t.String()),
	fontFamily: __nullable__(t.String()),
	fontFamilyUrl: __nullable__(t.String()),
	footerFacebookUrl: __nullable__(t.String()),
	footerInstagramUrl: __nullable__(t.String()),
	footerPaymentMethods: t.Array(t.String()),
	footerSupportEmail: __nullable__(t.String()),
	footerText: __nullable__(t.String()),
	footerWhatsApp: __nullable__(t.String()),
	ga4Id: __nullable__(t.String()),
	gtmId: __nullable__(t.String()),
	logoUrl: __nullable__(t.String()),
	metaPixelId: __nullable__(t.String()),
	mobileIconUrl: __nullable__(t.String()),
	orderStatusEmailTemplates: __nullable__(OrderStatusEmailTemplates),
	orderStatusWhatsAppTemplates: __nullable__(OrderStatusWhatsAppTemplates),
	themeColors: __nullable__(ThemeColors),
	unitFallbackImageUrl: __nullable__(t.String()),
	whatsAppEnabled: t.Boolean(),
});
export type BrandingReturn = typeof BrandingReturn.static;
