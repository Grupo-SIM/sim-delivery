import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { type GetUnits200, getUnitsQueryKey, useDeleteUnitsByUnitId } from "@/lib/api";
import { showAlert, showConfirm } from "@/stores";
import { UnitAddressEditor } from "./UnitAddressEditor";
import { UnitConfigEditor } from "./UnitConfigEditor";
import { UnitHoursEditor } from "./UnitHoursEditor";

interface UnitsTableProps {
	units: GetUnits200;
}

export function UnitsTable({ units }: UnitsTableProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const remove = useDeleteUnitsByUnitId();
	const [hoursUnitId, setHoursUnitId] = useState<string | null>(null);
	const [configUnit, setConfigUnit] = useState<GetUnits200[number] | null>(null);
	const [addressUnit, setAddressUnit] = useState<GetUnits200[number] | null>(null);

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
		<>
			<DataTable>
				<thead>
					<tr className="border-border border-b text-left text-muted-foreground">
						<th className="px-4 py-3 font-medium">{t("admin.units.columns.name")}</th>
						<th className="px-4 py-3 font-medium">{t("admin.units.columns.phone")}</th>
						<th className="px-4 py-3 font-medium">{t("admin.units.columns.city")}</th>
						<th className="px-4 py-3 font-medium">{t("admin.units.columns.status")}</th>
						<th className="px-4 py-3" />
					</tr>
				</thead>
				<tbody>
					{units.map(unit => (
						<tr className="border-border/60 border-b last:border-0" key={unit.id}>
							<td className="px-4 py-3 font-medium">{unit.name}</td>
							<td className="px-4 py-3 text-muted-foreground">{unit.phone ?? "—"}</td>
							<td className="px-4 py-3 text-muted-foreground">{unit.city ?? "—"}</td>
							<td className="px-4 py-3">
								<Badge
									className={
										unit.isOpenNow
											? "border-green-500/30 bg-green-500/10 text-green-500"
											: "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground"
									}
								>
									{unit.isOpenNow ? t("admin.units.status.open") : t("admin.units.status.closed")}
								</Badge>
							</td>
							<td className="px-4 py-3 text-right">
								<div className="flex justify-end gap-2">
									<Link
										className={buttonClassName({ size: "sm", variant: "outline" })}
										params={{ unitId: unit.id }}
										to="/admin/units/$unitId/products"
									>
										{t("admin.units.menu.action")}
									</Link>
									<Button onClick={() => setConfigUnit(unit)} size="sm" type="button" variant="outline">
										{t("admin.units.config.action")}
									</Button>
									<Button onClick={() => setAddressUnit(unit)} size="sm" type="button" variant="outline">
										{t("admin.units.address.action")}
									</Button>
									<Button onClick={() => setHoursUnitId(unit.id)} size="sm" type="button" variant="outline">
										{t("admin.units.hours.action")}
									</Button>
									<Button
										disabled={remove.isPending}
										onClick={() => deleteUnit(unit.id, unit.name)}
										size="sm"
										type="button"
										variant="outline"
									>
										{t("admin.units.row.delete")}
									</Button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</DataTable>

			<UnitHoursEditor onClose={() => setHoursUnitId(null)} unitId={hoursUnitId} />
			<UnitConfigEditor onClose={() => setConfigUnit(null)} unit={configUnit} />
			<UnitAddressEditor onClose={() => setAddressUnit(null)} unit={addressUnit} />
		</>
	);
}
