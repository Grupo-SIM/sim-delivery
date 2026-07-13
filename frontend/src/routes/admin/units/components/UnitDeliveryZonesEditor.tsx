import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { NumericInput } from "@/components/ui/NumericInput";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	getUnitsByUnitIdDeliveryZonesQueryKey,
	useGetUnitsByUnitIdDeliveryZones,
	usePutUnitsByUnitIdDeliveryZones,
} from "@/lib/api";
import { showAlert } from "@/stores";

interface ZoneRow {
	radiusKm: number;
	feeReais: number;
	etaMinMinutes: number | null;
	etaMaxMinutes: number | null;
}

const emptyRow: ZoneRow = { etaMaxMinutes: null, etaMinMinutes: null, feeReais: 0, radiusKm: 0 };

interface UnitDeliveryZonesEditorProps {
	onClose: () => void;
	unitId: string | null;
}

export function UnitDeliveryZonesEditor({ onClose, unitId }: UnitDeliveryZonesEditorProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data, isPending } = useGetUnitsByUnitIdDeliveryZones(unitId ?? undefined);
	const { isPending: isSaving, mutate } = usePutUnitsByUnitIdDeliveryZones();
	const [rows, setRows] = useState<ZoneRow[]>([]);

	useEffect(() => {
		if (!data) {
			return;
		}
		setRows(
			data.map(zone => ({
				etaMaxMinutes: zone.etaMaxMinutes != null ? Number(zone.etaMaxMinutes) : null,
				etaMinMinutes: zone.etaMinMinutes != null ? Number(zone.etaMinMinutes) : null,
				feeReais: Number(zone.fee) / 100,
				radiusKm: Number(zone.radiusKm),
			})),
		);
	}, [data]);

	function update(index: number, patch: Partial<ZoneRow>) {
		setRows(prev => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
	}

	function addRow() {
		setRows(prev => [...prev, { ...emptyRow }]);
	}

	function removeRow(index: number) {
		setRows(prev => prev.filter((_, i) => i !== index));
	}

	function save() {
		if (!unitId) {
			return;
		}
		mutate(
			{
				data: {
					zones: rows.map(row => ({
						etaMaxMinutes: row.etaMaxMinutes,
						etaMinMinutes: row.etaMinMinutes,
						fee: Math.round(row.feeReais * 100),
						radiusKm: row.radiusKm,
					})),
				},
				unitId,
			},
			{
				onError: () => void showAlert(t("admin.units.deliveryZones.error")),
				onSuccess: async () => {
					await queryClient.invalidateQueries({ queryKey: getUnitsByUnitIdDeliveryZonesQueryKey(unitId) });
					onClose();
				},
			},
		);
	}

	return (
		<Modal isOpen={unitId !== null} onClose={onClose} title={t("admin.units.deliveryZones.title")}>
			{isPending ? (
				<Skeleton className="h-64 w-full" />
			) : (
				<div className="space-y-4">
					<p className="text-muted-foreground text-sm">{t("admin.units.deliveryZones.description")}</p>

					<div className="space-y-3">
						{rows.map((row, index) => (
							<div className="flex items-end gap-2" key={index}>
								<div className="space-y-1">
									<span className="text-muted-foreground text-xs">
										{t("admin.units.deliveryZones.radiusKm")}
									</span>
									<NumericInput
										className="w-24"
										decimalScale={1}
										decimalSeparator=","
										onValueChange={({ floatValue }) => update(index, { radiusKm: floatValue ?? 0 })}
										placeholder="3,0"
										suffix=" km"
										value={row.radiusKm}
									/>
								</div>
								<div className="space-y-1">
									<span className="text-muted-foreground text-xs">{t("admin.units.deliveryZones.fee")}</span>
									<NumericInput
										className="w-28"
										decimalScale={2}
										decimalSeparator=","
										onValueChange={({ floatValue }) => update(index, { feeReais: floatValue ?? 0 })}
										placeholder="R$ 5,00"
										prefix="R$ "
										thousandSeparator="."
										value={row.feeReais}
									/>
								</div>
								<div className="space-y-1">
									<span className="text-muted-foreground text-xs">{t("admin.units.deliveryZones.etaMin")}</span>
									<NumericInput
										className="w-20"
										decimalScale={0}
										onValueChange={({ floatValue }) =>
											update(index, { etaMinMinutes: floatValue ?? null })
										}
										placeholder="20"
										suffix=" min"
										value={row.etaMinMinutes ?? 0}
									/>
								</div>
								<div className="space-y-1">
									<span className="text-muted-foreground text-xs">{t("admin.units.deliveryZones.etaMax")}</span>
									<NumericInput
										className="w-20"
										decimalScale={0}
										onValueChange={({ floatValue }) =>
											update(index, { etaMaxMinutes: floatValue ?? null })
										}
										placeholder="30"
										suffix=" min"
										value={row.etaMaxMinutes ?? 0}
									/>
								</div>
								<Button onClick={() => removeRow(index)} size="sm" type="button" variant="outline">
									{t("admin.units.deliveryZones.remove")}
								</Button>
							</div>
						))}
					</div>

					<Button onClick={addRow} size="sm" type="button" variant="outline">
						{t("admin.units.deliveryZones.add")}
					</Button>

					<div className="flex justify-end gap-2 border-border border-t pt-3">
						<Button onClick={onClose} type="button" variant="outline">
							{t("admin.units.deliveryZones.cancel")}
						</Button>
						<Button disabled={isSaving} onClick={save} type="button">
							{isSaving ? t("admin.units.deliveryZones.saving") : t("admin.units.deliveryZones.save")}
						</Button>
					</div>
				</div>
			)}
		</Modal>
	);
}
