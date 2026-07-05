import { useEffect } from "react";

/**
 * Applies a company's primaryColor as --primary CSS variable on :root.
 * Only active in the store (customer-facing) context; admin pages are unaffected.
 * Reverts to the built-in theme value when color is null/undefined.
 */
export function useBrandingTheme(primaryColor: string | null | undefined) {
	useEffect(() => {
		const root = document.documentElement;
		if (primaryColor) {
			root.style.setProperty("--primary", primaryColor);
		} else {
			root.style.removeProperty("--primary");
		}
		return () => {
			root.style.removeProperty("--primary");
		};
	}, [primaryColor]);
}
