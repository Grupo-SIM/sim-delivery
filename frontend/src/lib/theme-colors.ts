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

/** Saved palettes are authoritative; token usage never rewrites company colors. */
export function resolveThemeColors(themeColors: GetBrandingQueryResponse["themeColors"]): ThemeColors {
 return themeColors ?? defaultThemeColors;
}

export function toThemeVariable(name: keyof ThemeColorSet) {
	return name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

/** Feedback has no editable text token; derive readable ink without changing saved colors. */
export function feedbackForeground(hex: string) {
 const channels = hex.slice(1).match(/../g)!.map(channel => {
  const value = Number.parseInt(channel, 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
 });
 const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
 return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? "#000000" : "#FFFFFF";
}

export function themeColorsToCss(colors: ThemeColors) {
 const declarations = (colorSet: ThemeColorSet) => Object.entries({
  ...colorSet,
  destructiveForeground: feedbackForeground(colorSet.destructive),
  successForeground: feedbackForeground(colorSet.success),
  warningForeground: feedbackForeground(colorSet.warning),
 }).map(([name, value]) => `--${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}:${value}`).join(";");
 return `:root{${declarations(colors.light)}}:root.dark{${declarations(colors.dark)}}`;
}
