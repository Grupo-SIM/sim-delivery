import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetUnits } from "@/lib/api";
import { useAdminSelectedUnitStore } from "@/stores";

export function AdminUnitPicker() {
	const { t } = useTranslation();
	const { data: units = [], isPending } = useGetUnits();
	const unitId = useAdminSelectedUnitStore(state => state.unitId);
	const setUnitId = useAdminSelectedUnitStore(state => state.setUnitId);

	useEffect(() => {
		if (units.length === 0 || units.some(unit => unit.id === unitId)) return;

		setUnitId(units[0].id);
	}, [setUnitId, unitId, units]);

	if (isPending) return <Skeleton className="h-11 w-full" />;
	if (units.length === 0) return null;

	return (
		<div className="space-y-1.5">
			<span className="font-medium text-muted-foreground text-xs">{t("admin.dashboard.selectedUnit")}</span>
			<CustomSelect
				onChange={setUnitId}
				options={units.map(unit => ({ label: unit.name, value: unit.id }))}
				value={unitId ?? ""}
			/>
		</div>
	);
}
