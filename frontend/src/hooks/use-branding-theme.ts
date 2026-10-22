import { useEffect } from "react";
import { resolveThemeColors, type ThemeColors, themeColorsToCss } from "@/lib/theme-colors";

/**
 * Applies a company's theme colors as CSS variables on :root.
 * Reverts to the built-in theme values when colors are null/undefined.
 */
export function useBrandingTheme(themeColors: ThemeColors | null | undefined) {
	useEffect(() => {
		const colors = resolveThemeColors(themeColors ?? null);
		const style = document.createElement("style");
		style.dataset.brandingTheme = "true";
		style.textContent = themeColorsToCss(colors);
		document.head.append(style);
		window.dispatchEvent(new CustomEvent<ThemeColors>("branding-theme-change", { detail: colors }));
		return () => {
			style.remove();
			window.dispatchEvent(
				new CustomEvent<ThemeColors>("branding-theme-change", { detail: resolveThemeColors(null) }),
			);
		};
	}, [themeColors]);
}
