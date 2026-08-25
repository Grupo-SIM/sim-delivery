import { useTranslation } from "react-i18next";
import { LuPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { showToast } from "@/stores";

const MAX_BANNERS = 10;

interface BannerImagesEditorProps {
	bannerUrls: string[];
	onChange: (bannerUrls: string[]) => void;
	onUploadError: () => void;
}

export function BannerImagesEditor({ bannerUrls, onChange, onUploadError }: BannerImagesEditorProps) {
	const { t } = useTranslation();
	const canAdd = bannerUrls.length < MAX_BANNERS && bannerUrls.every(Boolean);

	function updateBanner(index: number, value: string) {
		const nextBannerUrls = [...bannerUrls];
		nextBannerUrls[index] = value;
		onChange(nextBannerUrls);
	}

	function addBanner() {
		onChange([...bannerUrls, ""]);
		showToast(t("admin.units.banner.added"), "info");
	}

	return (
		<div className="space-y-4">
			{bannerUrls.map((bannerUrl, index) => (
				<div className="space-y-2" key={index}>
					<p className="font-medium text-muted-foreground text-sm">
						{t("admin.units.banner.item", { number: index + 1 })}
					</p>
					<MediaUrlInput
						asset="banner"
						onUploadError={onUploadError}
						onValueChange={value => updateBanner(index, value)}
						preview
						previewClassName="h-48"
						uploadLabel={t("admin.units.banner.upload")}
						value={bannerUrl}
					/>
				</div>
			))}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="text-muted-foreground text-xs">{t("admin.units.banner.limitHint")}</p>
				<Button disabled={!canAdd} onClick={addBanner} type="button" variant="outline">
					<LuPlus aria-hidden className="size-4" />
					{t("admin.units.banner.add")}
				</Button>
			</div>
		</div>
	);
}
