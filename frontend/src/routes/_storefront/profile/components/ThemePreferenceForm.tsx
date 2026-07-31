import { useTranslation } from "react-i18next";
import { CustomSelect } from "@/components/ui/CustomSelect";
import type { ThemeMode } from "@/hooks/use-theme-preference";

interface ThemePreferenceFormProps {
	disabled: boolean;
	isSaving: boolean;
	mode: ThemeMode;
	onChange: (mode: ThemeMode) => void;
}

export function ThemePreferenceForm({ disabled, isSaving, mode, onChange }: ThemePreferenceFormProps) {
	const { t } = useTranslation();

	return (
		<section className="space-y-4 rounded-xl border border-border bg-card p-5">
			<div>
				<h2 className="font-semibold text-lg">{t("store.account.profile.appearance")}</h2>
				<p className="text-muted-foreground text-sm">{t("store.account.profile.appearanceHint")}</p>
			</div>
			<div>
				<p className="mb-2 font-medium text-sm">{t("store.account.profile.theme")}</p>
				<CustomSelect
					className={disabled || isSaving ? "pointer-events-none opacity-50" : undefined}
					onChange={value => onChange(value as ThemeMode)}
					options={[
						{ label: t("store.account.profile.themeLight"), value: "light" },
						{ label: t("store.account.profile.themeDark"), value: "dark" },
					]}
					value={mode}
				/>
			</div>
			{disabled && (
				<p className="text-muted-foreground text-sm">{t("store.account.profile.themeCompanyControlled")}</p>
			)}
		</section>
	);
}
