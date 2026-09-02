import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetUnits } from "@/lib/api";
import { useAdminSelectedUnitStore } from "@/stores";

interface AdminUnitPickerProps {
	compact?: boolean;
}

export function AdminUnitPicker({ compact = false }: AdminUnitPickerProps) {
	const { t } = useTranslation();
	const { data: units = [], isPending } = useGetUnits();
	const unitId = useAdminSelectedUnitStore(state => state.unitId);
	const setUnitId = useAdminSelectedUnitStore(state => state.setUnitId);

	useEffect(() => {
		if (units.length === 0 || units.some(unit => unit.id === unitId)) return;

		setUnitId(units[0].id);
	}, [setUnitId, unitId, units]);

	if (isPending) return <Skeleton className={compact ? "h-9 w-36 sm:w-44" : "h-11 w-full"} />;
	if (units.length === 0) return null;

	return (
		<div className={compact ? "w-36 sm:w-44" : "space-y-1.5"}>
			{!compact && (
				<span className="font-medium text-muted-foreground text-xs">{t("admin.dashboard.selectedUnit")}</span>
			)}
			<CustomSelect
				ariaLabel={t("admin.dashboard.selectedUnit")}
				className={compact ? "h-9" : undefined}
				onChange={setUnitId}
				options={units.map(unit => ({ label: unit.name, value: unit.id }))}
				value={unitId ?? ""}
			/>
		</div>
	);
}
