import { createDarkTheme, createLightTheme } from "baseui";

export type ThemeMode = "dark" | "light";

/**
 * Zero Grau brand primitives shared by both theme modes.
 * Royal blue is the button/action color; yellow and cyan are decorative accents.
 */
const brand = {
	blue: "#0012FF",
	blueDark: "#000FCC",
	blueLight: "#3342FF",
	cyan: "#00E5FF",
	ink: "#1A1A2E",
	red: "#E33E2B",
	white: "#FFFFFF",
	yellow: "#FFED00",
} as const;

/** Outfit is the brand UI font; applied to Base Web components via typography overrides. */
export const brandFontFamily = '"Outfit", "Inter", system-ui, sans-serif';

export const lightTheme = createLightTheme({
	colors: {
		accent: brand.blue,
		backgroundPrimary: "#F9FAFB",
		backgroundSecondary: "#FFFFFF",
		backgroundTertiary: "#EEF1F6",
		borderOpaque: "#E4E8F0",
		borderSelected: brand.blue,
		buttonPrimaryFill: brand.blue,
		buttonPrimaryHover: brand.blueDark,
		buttonPrimaryText: brand.white,
		contentInverseSecondary: "#FFFFFF",
		contentPrimary: brand.ink,
		contentSecondary: "#5B6472",
		contentTertiary: "#6B7280",
		inputBorder: "#D7DEE7",
		inputFill: "#FFFFFF",
		inputFillActive: "#FFFFFF",
		inputTextDisabled: "#9AA3B4",
		negative: brand.red,
		positive: "#1EBE5D",
		warning: "#FFB800",
	},
	typography: { font: { fontFamily: brandFontFamily } },
});

export const darkTheme = createDarkTheme({
	colors: {
		accent: brand.blueLight,
		backgroundPrimary: "#0A0E1F",
		backgroundSecondary: "#121734",
		backgroundTertiary: "#1B2145",
		borderOpaque: "#2A315C",
		borderSelected: brand.blueLight,
		buttonPrimaryFill: brand.blueLight,
		buttonPrimaryHover: brand.blue,
		buttonPrimaryText: brand.white,
		contentInverseSecondary: "#0A0E1F",
		contentPrimary: "#EEF1F8",
		contentSecondary: "#9AA3C4",
		contentTertiary: "#C3C7DC",
		inputBorder: "#2A315C",
		inputFill: "#0A0E14",
		inputFillActive: "#0A0E14",
		inputTextDisabled: "#9AA3C4",
		negative: "#F2543F",
		positive: "#1EBE5D",
		warning: "#FFB800",
	},
	typography: { font: { fontFamily: brandFontFamily } },
});

export function getAppTheme(mode: ThemeMode) {
	return mode === "dark" ? darkTheme : lightTheme;
}
