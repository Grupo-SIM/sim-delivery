import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuBookOpen, LuClock, LuImages, LuSettings, LuTrash2, LuTruck } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import { type GetUnits200, getUnitsQueryKey, useDeleteUnitsByUnitId } from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import { UnitDeliveryZonesEditor } from "./UnitDeliveryZonesEditor";
import { UnitEditor } from "./UnitEditor";
import { UnitHoursEditor } from "./UnitHoursEditor";
import { UnitPromotionalImagesEditor } from "./UnitPromotionalImagesEditor";

interface UnitsTableProps {
	units: GetUnits200;
}

export function UnitsTable({ units }: UnitsTableProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const remove = useDeleteUnitsByUnitId();
	const [hoursUnitId, setHoursUnitId] = useState<string | null>(null);
	const [editorUnit, setEditorUnit] = useState<GetUnits200[number] | null>(null);
	const [zonesUnit, setZonesUnit] = useState<GetUnits200[number] | null>(null);
	const [promotionsUnit, setPromotionsUnit] = useState<GetUnits200[number] | null>(null);

	if (units.length === 0) {
		return <EmptyState title={t("admin.units.empty")} />;
	}

	function deleteUnit(id: string) {
		remove.mutate(
			{ unitId: id },
			{
				onError: () => void showAlert(t("admin.units.row.deleteError")),
				onSuccess: () => {
					void queryClient.invalidateQueries({ queryKey: getUnitsQueryKey() });
					showToast(t("admin.units.row.deleteSuccess"), "positive");
				},
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
					{[...units]
						.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
						.map(unit => (
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
										<Tooltip content={t("admin.units.menu.action")}>
											<Link
												aria-label={t("admin.units.menu.action")}
												className={buttonClassName({ size: "icon", variant: "outline" })}
												params={{ unitId: unit.id }}
												to="/admin/units/$unitId/products"
											>
												<LuBookOpen className="h-4 w-4" />
											</Link>
										</Tooltip>
										<Tooltip content={t("admin.units.config.action")}>
											<Button
												aria-label={t("admin.units.config.action")}
												onClick={() => setEditorUnit(unit)}
												size="icon"
												type="button"
												variant="outline"
											>
												<LuSettings className="h-4 w-4" />
											</Button>
										</Tooltip>
										<Tooltip content={t("admin.units.promotionalImages.action")}>
											<Button
												aria-label={t("admin.units.promotionalImages.action")}
												onClick={() => setPromotionsUnit(unit)}
												size="icon"
												type="button"
												variant="outline"
											>
												<LuImages className="h-4 w-4" />
											</Button>
										</Tooltip>
										<Tooltip content={t("admin.units.hours.action")}>
											<Button
												aria-label={t("admin.units.hours.action")}
												onClick={() => setHoursUnitId(unit.id)}
												size="icon"
												type="button"
												variant="outline"
											>
												<LuClock className="h-4 w-4" />
											</Button>
										</Tooltip>
										<Tooltip content={t("admin.units.deliveryZones.action")}>
											<Button
												aria-label={t("admin.units.deliveryZones.action")}
												onClick={() => setZonesUnit(unit)}
												size="icon"
												type="button"
												variant="outline"
											>
												<LuTruck className="h-4 w-4" />
											</Button>
										</Tooltip>
										<ConfirmActionButton
											aria-label={t("admin.units.row.delete")}
											confirmation={t("admin.units.row.deleteConfirm", { name: unit.name })}
											confirmLabel={t("admin.units.row.delete")}
											disabled={remove.isPending}
											idleIcon={<LuTrash2 className="h-4 w-4" />}
											onConfirm={() => deleteUnit(unit.id)}
											size="icon"
											type="button"
											variant="outline"
										>
											{null}
										</ConfirmActionButton>
									</div>
								</td>
							</tr>
						))}
				</tbody>
			</DataTable>

			<UnitHoursEditor onClose={() => setHoursUnitId(null)} unitId={hoursUnitId} />
			<UnitEditor onClose={() => setEditorUnit(null)} unit={editorUnit} />
			<UnitDeliveryZonesEditor onClose={() => setZonesUnit(null)} unit={zonesUnit} />
			<UnitPromotionalImagesEditor onClose={() => setPromotionsUnit(null)} unit={promotionsUnit} />
		</>
	);
}
