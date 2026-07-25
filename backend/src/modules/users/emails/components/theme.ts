/**
 * Kinetic Velocity email theme — mirrors the frontend light-first design system.
 * Email clients require inline styles and hex colors (no CSS
 * variables / Tailwind), so the palette is duplicated here as plain values.
 */
import { emailBranding } from "@/shared/infra/branding";

export const emailColors = {
	background: "#f7f8fa",
	border: "#d7dee7",
	foreground: "#14171b",
	muted: "#53606c",
	primary: emailBranding.primaryColor,
	primaryForeground: emailBranding.primaryForegroundColor,
	surface: "#ffffff",
	surfaceDark: "#14171b",
} as const;

export const emailFontFamily = '"Hanken Grotesk", "Segoe UI", system-ui, -apple-system, sans-serif';
