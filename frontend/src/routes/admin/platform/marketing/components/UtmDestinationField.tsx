import { useTranslation } from "react-i18next";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useGetPublicUnits } from "@/lib/api";
import type { DestinationMode, DestinationState, UtmCompany } from "./types";

interface UtmDestinationFieldProps {
	company: UtmCompany;
	onChange: (value: DestinationState) => void;
	value: DestinationState;
}

/** Where the link lands for one company: home, one of its units (menu), or an arbitrary URL. */
export function UtmDestinationField({ company, onChange, value }: UtmDestinationFieldProps) {
	const { t } = useTranslation();
	const { data: units, isPending } = useGetPublicUnits({ slug: company.slug }, { query: { enabled: value.mode === "unit" } });
	const modes: DestinationMode[] = ["home", "unit", "url"];

	return (
		<div className="space-y-2 rounded-brand border border-border bg-muted/20 p-4">
			<span className="font-semibold text-sm">{company.name}</span>
			<div className="grid gap-3 sm:grid-cols-2">
				<CustomSelect
					ariaLabel={t("admin.marketing.utm.fields.destination")}
					onChange={mode => onChange({ ...value, mode: mode as DestinationMode })}
					options={modes.map(mode => ({ label: t(`admin.marketing.utm.mode.${mode}`), value: mode }))}
					value={value.mode}
				/>
				{value.mode === "unit" &&
					(isPending ? (
						<Skeleton className="h-11 w-full" />
					) : (
						<CustomSelect
							ariaLabel={t("admin.marketing.utm.fields.unit")}
							onChange={unitSlug => onChange({ ...value, unitSlug })}
							options={(units ?? []).map(unit => ({ label: unit.name, value: unit.slug }))}
							placeholder={t("admin.marketing.utm.unitPlaceholder")}
							value={value.unitSlug}
						/>
					))}
				{value.mode === "url" && (
					<TextField
						label={t("admin.marketing.utm.fields.url")}
						name={`url-${company.id}`}
						onValueChange={url => onChange({ ...value, url })}
						placeholder="https://loja.com/centro"
						value={value.url}
					/>
				)}
			</div>
		</div>
	);
}
