import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getUnitsQueryKey, type GetUnits200, useDeleteUnitsByUnitId } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { showAlert, showConfirm } from "@/stores";

interface UnitsTableProps {
	units: GetUnits200;
}

export function UnitsTable({ units }: UnitsTableProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const remove = useDeleteUnitsByUnitId();

	if (units.length === 0) {
		return <EmptyState title={t("admin.units.empty")} />;
	}

	async function deleteUnit(id: string, name: string) {
		if (!(await showConfirm(t("admin.units.row.deleteConfirm", { name })))) {
			return;
		}
		remove.mutate(
			{ unitId: id },
			{
				onError: () => void showAlert(t("admin.units.row.deleteError")),
				onSuccess: () => queryClient.invalidateQueries({ queryKey: getUnitsQueryKey() }),
			},
		);
	}

	return (
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					<th className="px-4 py-3 font-medium">{t("admin.units.columns.name")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.units.columns.phone")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.units.columns.city")}</th>
					<th className="px-4 py-3" />
				</tr>
			</thead>
			<tbody>
				{units.map(unit => (
					<tr className="border-border/60 border-b last:border-0" key={unit.id}>
						<td className="px-4 py-3 font-medium">{unit.name}</td>
						<td className="px-4 py-3 text-muted-foreground">{unit.phone ?? "—"}</td>
						<td className="px-4 py-3 text-muted-foreground">{unit.city ?? "—"}</td>
						<td className="px-4 py-3 text-right">
							<Button
								disabled={remove.isPending}
								onClick={() => deleteUnit(unit.id, unit.name)}
								size="sm"
								type="button"
								variant="outline"
							>
								{t("admin.units.row.delete")}
							</Button>
						</td>
					</tr>
				))}
			</tbody>
		</DataTable>
	);
}
