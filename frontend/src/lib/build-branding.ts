import type { ThemeColors } from "./theme-colors";

/**
 * Rewritten by `bun scripts/inject-variant.ts --slug=<company-slug>` before a
 * branded build. This fallback keeps unconfigured local development usable.
 */
export interface BuildBranding {
	companyName: string;
	footerText: string | null;
	ga4Id: string | null;
	gtmId: string | null;
	logoUrl: string | null;
	metaPixelId: string | null;
	themeColors: ThemeColors;
}

export const buildBranding: BuildBranding = {
	companyName: "Zero Grau Delivery",
	footerText: null,
	ga4Id: null,
	gtmId: null,
	logoUrl: null,
	metaPixelId: null,
	themeColors: {
		dark: {
			accent: "#FFED00",
			accentForeground: "#0A0E1F",
			background: "#0A0E1F",
			border: "#2A315C",
			card: "#121734",
			cardForeground: "#EEF1F8",
			destructive: "#F2543F",
			foreground: "#EEF1F8",
			input: "#2A315C",
			muted: "#1B2145",
			mutedForeground: "#9AA3C4",
			popover: "#121734",
			popoverForeground: "#EEF1F8",
			primary: "#3342FF",
			primaryForeground: "#FFFFFF",
			ring: "#3342FF",
			secondary: "#00E5FF",
			secondaryForeground: "#062033",
			success: "#1EBE5D",
			surfaceSunken: "#1B2145",
			warning: "#FFB800",
		},
		light: {
			accent: "#FFED00",
			accentForeground: "#0012FF",
			background: "#F9FAFB",
			border: "#E4E8F0",
			card: "#FFFFFF",
			cardForeground: "#1A1A2E",
			destructive: "#E33E2B",
			foreground: "#1A1A2E",
			input: "#E4E8F0",
			muted: "#EEF1F6",
			mutedForeground: "#5B6472",
			popover: "#FFFFFF",
			popoverForeground: "#1A1A2E",
			primary: "#0012FF",
			primaryForeground: "#FFFFFF",
			ring: "#0012FF",
			secondary: "#00E5FF",
			secondaryForeground: "#062033",
			success: "#1EBE5D",
			surfaceSunken: "#EEF1F6",
			warning: "#FFB800",
		},
	},
};
