import { useMemo } from "react";
import { type GetBrandingQueryResponse, useGetBranding } from "@/lib/api";
import { type Branding, branding as staticBranding } from "@/lib/branding";
import { resolveThemeColors } from "@/lib/theme-colors";
import { slug } from "@/lib/variant";

/**
 * Branding is baked into the build (frontend/scripts/inject.ts) so first paint never flashes
 * unstyled/placeholder content. This hook layers a background refetch on top so admin edits
 * (footer text, logo, colors, tracking ids) reach the storefront without a rebuild+redeploy.
 * Empty deployments use neutral defaults until database branding is configured.
 * apiUrl/packageName/siteUrl stay build-only.
 */
export function mergeLiveBranding(
	staticValues: Branding,
	data: GetBrandingQueryResponse | undefined,
): Branding {
	if (!data) return { ...staticValues, themeColors: resolveThemeColors(staticValues.themeColors) };

	return {
		...staticValues,
		allowThemeToggle: data.allowThemeToggle,
		companyName: data.companyName ?? staticValues.companyName,
		defaultTheme: data.defaultTheme,
		fontDisplay: data.fontDisplay?.trim() || "Inter",
		fontDisplayUrl: data.fontDisplayUrl,
		fontFamily: data.fontFamily?.trim() || "Inter",
		fontFamilyUrl: data.fontFamilyUrl,
		footerFacebookUrl: data.footerFacebookUrl,
		footerInstagramUrl: data.footerInstagramUrl,
		footerPaymentMethods: data.footerPaymentMethods,
		footerSupportEmail: data.footerSupportEmail,
		footerText: data.footerText,
		footerWhatsApp: data.footerWhatsApp,
		whatsAppEnabled: data.whatsAppEnabled,
		ga4Id: data.ga4Id,
		gtmId: data.gtmId,
		logoUrl: data.logoUrl?.trim() || "",
		metaPixelId: data.metaPixelId,
		themeColors: resolveThemeColors(data.themeColors),
	};
}

export function useLiveBranding(): Branding {
	const { data } = useGetBranding({ slug }, { query: { staleTime: 5 * 60 * 1000 } });

	return useMemo(() => mergeLiveBranding(staticBranding, data), [data]);
}
