/**
 * Transactional email theme — mirrors the active frontend light theme.
 * Email clients require inline styles and hex colors (no CSS
 * variables / Tailwind), so the palette is duplicated here as plain values.
 */
import { emailBranding } from "@/shared/infra/branding";

export const emailColors = {
	background: emailBranding.themeColors.surfaceSunken,
	border: emailBranding.themeColors.border,
	foreground: emailBranding.themeColors.foreground,
	muted: emailBranding.themeColors.mutedForeground,
	primary: emailBranding.themeColors.primary,
	primaryForeground: emailBranding.themeColors.primaryForeground,
	surface: emailBranding.themeColors.card,
	surfaceMuted: emailBranding.themeColors.muted,
} as const;

export const emailFontFamily = `"${emailBranding.fontFamily}", "Segoe UI", Arial, sans-serif`;
