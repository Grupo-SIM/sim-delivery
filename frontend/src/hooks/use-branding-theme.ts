import { useEffect } from "react";
import { resolveThemeColors, toThemeVariable, type ThemeColors } from "@/lib/theme-colors";

/**
 * Applies a company's theme colors as CSS variables on :root.
 * Reverts to the built-in theme value when color is null/undefined.
 */
export function useBrandingTheme(themeColors: ThemeColors | null | undefined, primaryColor?: string | null) {
	useEffect(() => {
		const root = document.documentElement;
		const colors = resolveThemeColors(themeColors ?? null, primaryColor);
		const style = document.createElement("style");
		style.dataset.brandingTheme = "true";
		style.textContent = (["light", "dark"] as const)
			.map(mode => {
				const selector = mode === "dark" ? ":root.dark" : ":root";
				const values = Object.entries(colors[mode])
					.map(([name, value]) => `--${toThemeVariable(name as keyof ThemeColors["light"])}:${value}`)
					.join(";");
				return `${selector}{${values}}`;
			})
			.join("");
		document.head.append(style);
		window.dispatchEvent(new CustomEvent<ThemeColors>("branding-theme-change", { detail: colors }));
		return () => {
			style.remove();
			window.dispatchEvent(
				new CustomEvent<ThemeColors>("branding-theme-change", { detail: resolveThemeColors(null) }),
			);
		};
	}, [primaryColor, themeColors]);
}
