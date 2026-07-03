import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CustomSelect } from "@/components/ui/CustomSelect";
import type { GetPublicUnits200 } from "@/lib/api";

interface UnitSwitcherProps {
	unitId: string;
	units: GetPublicUnits200;
}

/** Inline unit picker: switching navigates to the chosen unit's storefront. */
export function UnitSwitcher({ unitId, units }: UnitSwitcherProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	if (units.length <= 1) {
		return null;
	}

	return (
		<div className="w-full sm:w-56">
			<span className="mb-1 block font-medium text-muted-foreground text-xs">{t("store.unit.switch")}</span>
			<CustomSelect
				onChange={value => {
					if (value !== unitId) {
						void navigate({ params: { unitId: value }, to: "/$unitId" });
					}
				}}
				options={units.map(unit => ({ label: unit.name, value: unit.id }))}
				value={unitId}
			/>
		</div>
	);
}
