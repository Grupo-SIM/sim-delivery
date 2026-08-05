import { useTranslation } from "react-i18next";
import { LuChartNoAxesCombined } from "react-icons/lu";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { TextField } from "@/components/ui/TextField";
import type { TrackingState } from "./types";

interface TrackingSectionProps {
	onChange: (changes: Partial<TrackingState>) => void;
	tracking: TrackingState;
}

export function TrackingSection({ onChange, tracking }: TrackingSectionProps) {
	const { t } = useTranslation();
	const configured = [
		tracking.metaPixelId && t("admin.branding.metaPixelShort"),
		tracking.ga4Id && t("admin.branding.ga4Short"),
		tracking.gtmId && t("admin.branding.gtmShort"),
	].filter(Boolean);

	return (
		<CollapsibleSection
			icon={LuChartNoAxesCombined}
			summary={configured.length ? configured.join(" · ") : t("admin.branding.trackingSummaryEmpty")}
			title={t("admin.branding.sectionTracking")}
		>
			<TextField
				label={t("admin.branding.metaPixelId")}
				onValueChange={metaPixelId => onChange({ metaPixelId })}
				placeholder="1234567890"
				value={tracking.metaPixelId}
			/>
			<TextField
				label={t("admin.branding.ga4Id")}
				onValueChange={ga4Id => onChange({ ga4Id })}
				placeholder="G-XXXXXXXXXX"
				value={tracking.ga4Id}
			/>
			<TextField
				label={t("admin.branding.gtmId")}
				onValueChange={gtmId => onChange({ gtmId })}
				placeholder="GTM-XXXXXXX"
				value={tracking.gtmId}
			/>
		</CollapsibleSection>
	);
}
