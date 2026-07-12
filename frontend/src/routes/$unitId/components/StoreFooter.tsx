import { useTranslation } from "react-i18next";
import { useBrandingTheme } from "@/hooks/use-branding-theme";
import { useTracking } from "@/hooks/use-tracking";
import { useGetBranding } from "@/lib/api";

interface StoreFooterProps {
	unitId: string;
}

export function StoreFooter({ unitId }: StoreFooterProps) {
	const { t } = useTranslation();
	const { data: branding } = useGetBranding({ unitId });

	useTracking({
		ga4Id: branding?.ga4Id,
		gtmId: branding?.gtmId,
		metaPixelId: branding?.metaPixelId,
	});
	useBrandingTheme(branding?.primaryColor);

	const text = branding?.footerText;
	const logoUrl = branding?.logoUrl;

	if (!text && !logoUrl) return null;

	return (
		<footer className="mt-8 space-y-2 border-border border-t pt-6 pb-8 text-center text-muted-foreground text-sm">
			{logoUrl && <img alt="store logo" className="mx-auto h-10 object-contain" src={logoUrl} />}
			{text && <p>{text}</p>}
			<p className="text-xs opacity-60">{t("store.branding.poweredBy")} Zero Grau</p>
		</footer>
	);
}
