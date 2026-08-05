import { useTranslation } from "react-i18next";
import { LuType } from "react-icons/lu";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { showToast } from "@/stores";
import { FontField } from "./FontField";
import type { FontsState } from "./types";

interface TypographySectionProps {
	fonts: FontsState;
	onChange: (changes: Partial<FontsState>) => void;
}

export function TypographySection({ fonts, onChange }: TypographySectionProps) {
	const { t } = useTranslation();
	const uploadError = () => showToast(t("admin.branding.uploadError"), "negative");

	const configured = [fonts.family, fonts.display].filter(Boolean);

	return (
		<CollapsibleSection
			icon={LuType}
			summary={configured.length ? configured.join(" · ") : t("admin.branding.typographySummaryEmpty")}
			title={t("admin.branding.sectionTypography")}
		>
			<FontField
				family={fonts.family}
				label={t("admin.branding.fontFamily")}
				onUploadError={uploadError}
				onUrlChange={familyUrl => onChange({ familyUrl, ...(familyUrl && { family: "Brand Text" }) })}
				previewLabel={t("admin.branding.fontFamilyPreview")}
				sampleClassName="text-lg"
				sampleText="Aa Bb Cc 123"
				uploadAsset="font-family"
				url={fonts.familyUrl}
			/>

			<FontField
				family={fonts.display}
				label={t("admin.branding.fontDisplay")}
				onUploadError={uploadError}
				onUrlChange={displayUrl => onChange({ displayUrl, ...(displayUrl && { display: "Brand Display" }) })}
				previewLabel={t("admin.branding.fontDisplayPreview")}
				sampleClassName="text-2xl"
				sampleText="Aa Bb Cc 123"
				uploadAsset="font-display"
				url={fonts.displayUrl}
			/>
		</CollapsibleSection>
	);
}
