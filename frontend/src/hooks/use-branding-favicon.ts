import { useEffect } from "react";

/**
 * Points the browser tab favicon at the company's logo once branding loads.
 * Reverts to the build's default favicon (favicon.png) on unmount/logo change.
 */
export function useBrandingFavicon(logoUrl: string | null | undefined) {
	useEffect(() => {
		if (!logoUrl) return;

		const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
		if (!link) return;

		const previousHref = link.href;
		const previousType = link.type;
		link.href = logoUrl;
		link.removeAttribute("type");

		return () => {
			link.href = previousHref;
			link.type = previousType;
		};
	}, [logoUrl]);
}
