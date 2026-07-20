import { useMemo } from "react";
import { useGetBranding } from "@/lib/api";
import { type Branding, branding as staticBranding } from "@/lib/branding";
import { resolveThemeColors } from "@/lib/theme-colors";
import { slug } from "@/lib/variant";

/**
 * Branding is baked into the build (frontend/scripts/inject.ts) so first paint never flashes
 * unstyled/placeholder content. This hook layers a background refetch on top so admin edits
 * (footer text, logo, colors, tracking ids) reach the storefront without a rebuild+redeploy.
 * apiUrl/packageName/siteUrl stay build-only — they're needed before any request can be made.
 */
export function useLiveBranding(): Branding {
	const { data } = useGetBranding({ slug }, { query: { staleTime: 5 * 60 * 1000 } });

	return useMemo<Branding>(() => {
		if (!data) return { ...staticBranding, themeColors: resolveThemeColors(staticBranding.themeColors) };

		return {
			...staticBranding,
			companyName: data.companyName ?? staticBranding.companyName,
			footerFacebookUrl: data.footerFacebookUrl,
			footerInstagramUrl: data.footerInstagramUrl,
			footerPaymentMethods: data.footerPaymentMethods,
			footerSupportEmail: data.footerSupportEmail,
			fontDisplay: data.fontDisplay?.trim() || staticBranding.fontDisplay,
			fontDisplayUrl: data.fontDisplayUrl ?? staticBranding.fontDisplayUrl,
			fontFamily: data.fontFamily?.trim() || staticBranding.fontFamily,
			fontFamilyUrl: data.fontFamilyUrl ?? staticBranding.fontFamilyUrl,
			footerText: data.footerText,
			footerWhatsApp: data.footerWhatsApp,
			ga4Id: data.ga4Id,
			gtmId: data.gtmId,
			logoUrl: data.logoUrl ?? staticBranding.logoUrl,
			metaPixelId: data.metaPixelId,
			themeColors: resolveThemeColors(data.themeColors ?? staticBranding.themeColors),
		};
	}, [data]);
}
