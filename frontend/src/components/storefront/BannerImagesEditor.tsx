import { useTranslation } from "react-i18next";
import { LuPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { CustomSelect, type SelectOption } from "@/components/ui/CustomSelect";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { showToast } from "@/stores";

const MAX_BANNERS = 10;

interface BannerImagesEditorProps {
	bannerProductIds: string[];
	bannerUrls: string[];
	onChange: (bannerUrls: string[]) => void;
	onProductChange: (bannerProductIds: string[]) => void;
	onUploadError: () => void;
	productOptions: SelectOption[];
}

export function BannerImagesEditor({
	bannerProductIds,
	bannerUrls,
	onChange,
	onProductChange,
	productOptions,
	onUploadError,
}: BannerImagesEditorProps) {
	const { t } = useTranslation();
	const canAdd = bannerUrls.length < MAX_BANNERS && bannerUrls.every(Boolean);

	function updateBanner(index: number, value: string) {
		const nextBannerUrls = [...bannerUrls];
		nextBannerUrls[index] = value;
		onChange(nextBannerUrls);
	}

	function updateProduct(index: number, value: string) {
		const nextProductIds = bannerUrls.map((_, position) => bannerProductIds[position] ?? "");
		nextProductIds[index] = value;
		onProductChange(nextProductIds);
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
					<div className="space-y-1">
						<p className="text-muted-foreground text-xs">{t("admin.units.banner.product")}</p>
						<CustomSelect
							ariaLabel={t("admin.units.banner.product")}
							onChange={value => updateProduct(index, value)}
							options={[{ label: t("admin.units.banner.productNone"), value: "" }, ...productOptions]}
							value={bannerProductIds[index] ?? ""}
						/>
					</div>
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
