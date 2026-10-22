import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuBookOpen, LuClock, LuDoorClosed, LuMessageCircle, LuSettings, LuSlash, LuTruck } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button-styles";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import { type GetUnits200, getUnitsQueryKey, usePatchUnitsByUnitId } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { showAlert, showToast } from "@/stores";
import { UnitDeliveryZonesEditor } from "./UnitDeliveryZonesEditor";
import { UnitEditor } from "./UnitEditor";
import { UnitHoursEditor } from "./UnitHoursEditor";
import { UnitWhatsAppEditor } from "./UnitWhatsAppEditor";

interface UnitsTableProps {
	units: GetUnits200;
}

export function UnitsTable({ units }: UnitsTableProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const update = usePatchUnitsByUnitId();
	const [hoursUnitId, setHoursUnitId] = useState<string | null>(null);
	const [editorUnit, setEditorUnit] = useState<GetUnits200[number] | null>(null);
	const [zonesUnit, setZonesUnit] = useState<GetUnits200[number] | null>(null);
	const [whatsAppUnit, setWhatsAppUnit] = useState<GetUnits200[number] | null>(null);
	const canManageWhatsApp = ["manager", "owner", "superAdmin"].includes(session?.user.role ?? "");

	if (units.length === 0) {
		return <EmptyState title={t("admin.units.empty")} />;
	}

	function updateUnitStatus(unit: GetUnits200[number]) {
		update.mutate(
			{ data: { active: !unit.active }, unitId: unit.id },
			{
				onError: () => void showAlert(t("admin.units.row.statusError")),
				onSuccess: () => {
					void queryClient.invalidateQueries({ queryKey: getUnitsQueryKey() });
					showToast(
						t(unit.active ? "admin.units.row.activateSuccess" : "admin.units.row.deactivateSuccess"),
						"positive",
					);
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
							<tr
								className={`border-border/60 border-b last:border-0 ${unit.active ? "" : "opacity-50"}`}
								key={unit.id}
							>
								<td className="px-4 py-3 font-medium">
									<div className="flex items-center gap-3">
										{unit.imageUrl && (
											<img alt="" className="h-10 w-10 shrink-0 rounded object-cover" src={unit.imageUrl} />
										)}
										<span>{unit.name}</span>
									</div>
								</td>
								<td className="px-4 py-3 text-muted-foreground">{unit.phone ?? "—"}</td>
								<td className="px-4 py-3 text-muted-foreground">{unit.city ?? "—"}</td>
								<td className="px-4 py-3">
									<div className="flex items-center gap-2">
										{unit.active && (
											<Badge
												className={
													unit.isOpenNow
														? "border-success/30 bg-success/10 text-success"
														: "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground"
												}
											>
												{unit.isOpenNow ? t("admin.units.status.open") : t("admin.units.status.closed")}
											</Badge>
										)}
									</div>
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
										{canManageWhatsApp && <Tooltip content={t("admin.units.whatsApp.action")}>
											<Button
												aria-label={t("admin.units.whatsApp.action")}
												onClick={() => setWhatsAppUnit(unit)}
												size="icon"
												type="button"
												variant="outline"
											>
												<LuMessageCircle className="h-4 w-4" />
											</Button>
										</Tooltip>}
										<Tooltip
											content={t(unit.active ? "admin.units.row.deactivate" : "admin.units.row.activate")}
										>
											<Button
												aria-label={t(
													unit.active ? "admin.units.row.deactivate" : "admin.units.row.activate",
												)}
												disabled={update.isPending}
												onClick={() => updateUnitStatus(unit)}
												size="icon"
												type="button"
												variant="outline"
											>
												{unit.active ? (
													<span className="relative block h-4 w-4">
														<LuDoorClosed className="h-4 w-4" />
														<LuSlash className="absolute inset-0 h-4 w-4" />
													</span>
												) : (
													<LuDoorClosed className="h-4 w-4" />
												)}
											</Button>
										</Tooltip>
									</div>
								</td>
							</tr>
						))}
				</tbody>
			</DataTable>

			<UnitHoursEditor onClose={() => setHoursUnitId(null)} unitId={hoursUnitId} />
			<UnitEditor onClose={() => setEditorUnit(null)} unit={editorUnit} />
			<UnitDeliveryZonesEditor onClose={() => setZonesUnit(null)} unit={zonesUnit} />
			<UnitWhatsAppEditor onClose={() => setWhatsAppUnit(null)} unit={whatsAppUnit} />
		</>
	);
}
