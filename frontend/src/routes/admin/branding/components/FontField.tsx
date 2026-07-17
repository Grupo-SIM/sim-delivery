import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { useGoogleFont } from "@/hooks/use-google-font";
import type { MediaAsset } from "@/lib/api";
import { useTranslation } from "react-i18next";

interface FontFieldProps {
	label: string;
	onUrlChange: (value: string) => void;
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
	previewLabel,
	sampleClassName,
	sampleText,
	family,
	url,
	uploadAsset,
	onUploadError,
}: FontFieldProps) {
	const { t } = useTranslation();
	useGoogleFont(url ? "" : family);

	return (
		<div className="space-y-3">
			<div className="space-y-1">
				<span className="font-medium text-sm">{label}</span>
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
