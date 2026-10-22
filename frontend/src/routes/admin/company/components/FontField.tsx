import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { useGoogleFont } from "@/hooks/use-google-font";
import type { MediaAsset } from "@/lib/api";

interface FontFieldProps {
	label: string;
	onUrlChange: (value: string) => void;
	onFamilyChange: (value: string) => void;
	previewLabel: string;
	sampleClassName?: string;
	sampleText: string;
	family: string;
	url: string;
	uploadAsset: MediaAsset;
	onUploadError: () => void;
}

export function FontField({
	label,
	onUrlChange,
	onFamilyChange,
	previewLabel,
	sampleClassName,
	sampleText,
	family,
	url,
	uploadAsset,
	onUploadError,
}: FontFieldProps) {
	const { t } = useTranslation();
	const [custom, setCustom] = useState(false);
	useGoogleFont(url ? "" : family);
	useGoogleFont("Montserrat");
	useGoogleFont("Poppins");
	const popularFonts = ["Inter", "Montserrat", "Poppins", "Arial", "Times New Roman"];
	const options = popularFonts.map(name => ({ label: name, value: name, fontFamily: `"${name}"` }));
	options.push({ label: `${t("admin.branding.fontFileUrl")} / ${t("admin.branding.fontUpload")}`, value: "custom", fontFamily: "inherit" });
	const selected = !custom && !url && popularFonts.includes(family) ? family : "custom";

	return (
		<div className="space-y-3">
			<div className="space-y-1">
				<span className="font-medium text-sm">{label}</span>
				<CustomSelect
					ariaLabel={label}
					onChange={value => {
						setCustom(value === "custom");
						if (value !== "custom") onFamilyChange(value);
					}}
					options={options}
					value={selected}
				/>
				<MediaUrlInput
					asset={uploadAsset}
					onUploadError={onUploadError}
					onValueChange={onUrlChange}
					uploadLabel={t("admin.branding.fontUpload")}
					value={url}
				/>
			</div>

			{family && (
				<div className="rounded border border-border p-3">
					<p className="mb-2 font-medium text-muted-foreground text-xs uppercase">{previewLabel}</p>
					<p className={sampleClassName} style={{ fontFamily: `"${family}", sans-serif` }}>
						{sampleText}
					</p>
				</div>
			)}
		</div>
	);
}
