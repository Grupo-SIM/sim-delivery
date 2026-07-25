import type { GetBrandingQueryResponse } from "@/lib/api";

export type ThemeColorSet = NonNullable<GetBrandingQueryResponse["themeColors"]>["light"];
export interface ThemeColors {
	dark: ThemeColorSet;
	light: ThemeColorSet;
}

export const defaultThemeColors: ThemeColors = {
	dark: {
		accent: "#FFFFFF",
		accentForeground: "#000000",
		background: "#000000",
		border: "#404040",
		card: "#171717",
		cardForeground: "#FFFFFF",
		destructive: "#FFFFFF",
		foreground: "#FFFFFF",
		input: "#404040",
		muted: "#262626",
		mutedForeground: "#A3A3A3",
		popover: "#171717",
		popoverForeground: "#FFFFFF",
		primary: "#FFFFFF",
		primaryForeground: "#000000",
		ring: "#FFFFFF",
		secondary: "#262626",
		secondaryForeground: "#FFFFFF",
		success: "#FFFFFF",
		surfaceSunken: "#262626",
		warning: "#FFFFFF",
	},
	light: {
		accent: "#000000",
		accentForeground: "#FFFFFF",
		background: "#FFFFFF",
		border: "#D4D4D4",
		card: "#FFFFFF",
		cardForeground: "#000000",
		destructive: "#000000",
		foreground: "#000000",
		input: "#D4D4D4",
		muted: "#F5F5F5",
		mutedForeground: "#525252",
		popover: "#FFFFFF",
		popoverForeground: "#000000",
		primary: "#000000",
		primaryForeground: "#FFFFFF",
		ring: "#000000",
		secondary: "#F5F5F5",
		secondaryForeground: "#000000",
		success: "#000000",
		surfaceSunken: "#F5F5F5",
		warning: "#000000",
	},
};

const legacyThemeColors: ThemeColors = {
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
};

function isLegacyThemeColors(themeColors: ThemeColors) {
	return (["dark", "light"] as const).every(mode =>
		Object.entries(legacyThemeColors[mode]).every(
			([name, value]) => themeColors[mode][name as keyof ThemeColorSet] === value,
		),
	);
}

export function resolveThemeColors(themeColors: GetBrandingQueryResponse["themeColors"]): ThemeColors {
	if (!themeColors || isLegacyThemeColors(themeColors)) return defaultThemeColors;
	return themeColors;
}

export function toThemeVariable(name: keyof ThemeColorSet) {
	return name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

export function themeColorsToCss(colors: ThemeColors) {
	const declarations = (colorSet: ThemeColorSet) =>
		Object.entries(colorSet)
			.map(([name, value]) => `--${toThemeVariable(name as keyof ThemeColorSet)}:${value}`)
			.join(";");
	return `:root{${declarations(colors.light)}}:root.dark{${declarations(colors.dark)}}`;
}
