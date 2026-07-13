import { createDarkTheme, createLightTheme } from "baseui";
import { defaultThemeColors, type ThemeColors } from "./theme-colors";

export type ThemeMode = "dark" | "light";

/** Outfit is the brand UI font; applied to Base Web components via typography overrides. */
export const brandFontFamily = '"Outfit", "Inter", system-ui, sans-serif';

export function getAppTheme(mode: ThemeMode, themeColors: ThemeColors = defaultThemeColors) {
	const colors = themeColors[mode];
	return (mode === "dark" ? createDarkTheme : createLightTheme)({
		colors: {
			accent: colors.primary,
			backgroundPrimary: colors.background,
			backgroundSecondary: colors.card,
			backgroundTertiary: colors.muted,
			borderOpaque: colors.border,
			borderSelected: colors.primary,
			buttonPrimaryFill: colors.primary,
			buttonPrimaryHover: colors.primary,
			buttonPrimaryText: colors.primaryForeground,
			contentInverseSecondary: colors.primaryForeground,
			contentPrimary: colors.foreground,
			contentSecondary: colors.mutedForeground,
			contentTertiary: colors.mutedForeground,
			inputBorder: colors.input,
			inputFill: colors.card,
			inputFillActive: colors.card,
			inputTextDisabled: colors.mutedForeground,
			negative: colors.destructive,
			positive: colors.success,
			warning: colors.warning,
		},
		typography: { font: { fontFamily: brandFontFamily } },
	});
}
