import { useTranslation } from "react-i18next";
import { LuImage } from "react-icons/lu";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Label } from "@/components/ui/label";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { showToast } from "@/stores";
import type { BrandAssetsState } from "./types";

interface BrandAssetsSectionProps {
	assets: BrandAssetsState;
	onChange: (changes: Partial<BrandAssetsState>) => void;
}

export function BrandAssetsSection({ assets, onChange }: BrandAssetsSectionProps) {
	const { t } = useTranslation();
	const uploadError = () => showToast(t("admin.branding.uploadError"), "negative");

	const configured = [
		assets.logoUrl && t("admin.branding.logoShort"),
		assets.mobileIconUrl && t("admin.branding.mobileIconShort"),
		assets.unitFallbackImageUrl && t("admin.branding.unitFallbackImageShort"),
	].filter(Boolean);

	return (
		<CollapsibleSection
			icon={LuImage}
			preview={
				assets.logoUrl ? (
					<img alt="" className="h-8 w-auto max-w-32 object-contain" src={assets.logoUrl} />
				) : undefined
			}
			summary={configured.length ? configured.join(" · ") : t("admin.branding.assetsSummaryEmpty")}
			title={t("admin.branding.sectionAssets")}
		>
			<Label>
				{t("admin.branding.logoUrl")}
				<MediaUrlInput
					asset="logo"
					onUploadError={uploadError}
					onValueChange={logoUrl => onChange({ logoUrl })}
					preview
					uploadLabel={t("admin.branding.logoUpload")}
					value={assets.logoUrl}
				/>
			</Label>

			<Label>
				{t("admin.branding.mobileIconUrl")}
				<MediaUrlInput
					asset="mobile-icon"
					onUploadError={uploadError}
					onValueChange={mobileIconUrl => onChange({ mobileIconUrl })}
					preview
					uploadLabel={t("admin.branding.mobileIconUpload")}
					value={assets.mobileIconUrl}
				/>
				<p className="text-muted-foreground text-sm">{t("admin.branding.mobileIconHint")}</p>
			</Label>

			<Label>
				{t("admin.branding.unitFallbackImageUrl")}
				<MediaUrlInput
					asset="unit"
					onUploadError={uploadError}
					onValueChange={unitFallbackImageUrl => onChange({ unitFallbackImageUrl })}
					preview
					uploadLabel={t("admin.branding.unitFallbackImageUpload")}
					value={assets.unitFallbackImageUrl}
				/>
			</Label>
		</CollapsibleSection>
	);
}
