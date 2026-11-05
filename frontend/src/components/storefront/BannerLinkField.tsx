import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { useDebouncedInput } from "@/hooks/use-debounced-input";

interface BannerLinkFieldProps {
	onChange: (value: string) => void;
	value: string;
}

export function BannerLinkField({ onChange, value }: BannerLinkFieldProps) {
	const { t } = useTranslation();
	const [local, setLocal] = useDebouncedInput(value, onChange);

	return (
		<div className="space-y-1">
			<p className="text-muted-foreground text-xs">{t("admin.units.banner.link")}</p>
			<Input
				aria-label={t("admin.units.banner.link")}
				autoComplete="off"
				inputMode="url"
				name="bannerLink"
				onChange={event => setLocal(event.currentTarget.value)}
				placeholder={t("admin.units.banner.linkPlaceholder")}
				type="text"
				value={local}
			/>
		</div>
	);
}
