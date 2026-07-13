import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { NumericInput } from "@/components/ui/NumericInput";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	type GetUnits200,
	getUnitsByUnitIdDeliveryZonesQueryKey,
	getUnitsQueryKey,
	useGetUnitsByUnitIdDeliveryZones,
	usePatchUnitsByUnitId,
	usePutUnitsByUnitIdDeliveryZones,
} from "@/lib/api";
import { showAlert } from "@/stores";

type Unit = GetUnits200[number];
type DeliveryMethod = "delivery" | "pickup";
const METHODS: DeliveryMethod[] = ["delivery", "pickup"];

interface ZoneRow {
	radiusKm: number;
	feeReais: number;
	etaMinMinutes: number | null;
	etaMaxMinutes: number | null;
}

const emptyRow: ZoneRow = { etaMaxMinutes: null, etaMinMinutes: null, feeReais: 0, radiusKm: 0 };

interface UnitDeliveryZonesEditorProps {
	onClose: () => void;
	unit: Unit | null;
}

export function UnitDeliveryZonesEditor({ onClose, unit }: UnitDeliveryZonesEditorProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const unitId = unit?.id ?? null;
	const { data, isPending } = useGetUnitsByUnitIdDeliveryZones(unitId ?? undefined);
	const { isPending: isSavingZones, mutateAsync: saveZones } = usePutUnitsByUnitIdDeliveryZones();
	const { isPending: isSavingUnit, mutateAsync: saveUnit } = usePatchUnitsByUnitId();
	const isSaving = isSavingZones || isSavingUnit;
	const [rows, setRows] = useState<ZoneRow[]>([]);
	const [methods, setMethods] = useState<DeliveryMethod[]>([]);
	const [feeReais, setFeeReais] = useState(0);
	const [feeFallbackEnabled, setFeeFallbackEnabled] = useState(true);

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

	useEffect(() => {
		if (!unit) {
			return;
		}
		setMethods(METHODS.filter(method => unit.deliveryMethods.includes(method)));
		setFeeReais(Number(unit.deliveryFee) / 100);
		setFeeFallbackEnabled(unit.deliveryFeeFallbackEnabled);
	}, [unit]);

	function toggleMethod(method: DeliveryMethod, checked: boolean) {
		setMethods(prev => (checked ? [...new Set([...prev, method])] : prev.filter(m => m !== method)));
	}

	function update(index: number, patch: Partial<ZoneRow>) {
		setRows(prev => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
	}

	function addRow() {
		setRows(prev => [...prev, { ...emptyRow }]);
	}

	function removeRow(index: number) {
		setRows(prev => prev.filter((_, i) => i !== index));
	}

	async function save() {
		if (!unitId) {
			return;
		}
		try {
			await Promise.all([
				saveZones({
					data: {
						zones: rows.map(row => ({
							etaMaxMinutes: row.etaMaxMinutes,
							etaMinMinutes: row.etaMinMinutes,
							fee: Math.round(row.feeReais * 100),
							radiusKm: row.radiusKm,
						})),
					},
					unitId,
				}),
				saveUnit({
					data: {
						deliveryFee: Math.round(feeReais * 100),
						deliveryFeeFallbackEnabled: feeFallbackEnabled,
						deliveryMethods: methods,
					},
					unitId,
				}),
			]);
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: getUnitsByUnitIdDeliveryZonesQueryKey(unitId) }),
				queryClient.invalidateQueries({ queryKey: getUnitsQueryKey() }),
			]);
			onClose();
		} catch {
			void showAlert(t("admin.units.deliveryZones.error"));
		}
	}

	return (
		<Modal isOpen={unitId !== null} onClose={onClose} title={t("admin.units.deliveryZones.title")}>
			{isPending ? (
				<Skeleton className="h-64 w-full" />
			) : (
				<div className="space-y-4">
					<p className="text-muted-foreground text-sm">{t("admin.units.deliveryZones.description")}</p>

					<div className="space-y-2">
						<span className="font-medium text-sm">{t("admin.units.config.deliveryMethods")}</span>
						<div className="flex gap-4">
							{METHODS.map(method => (
								<label className="flex items-center gap-2 text-sm" key={method}>
									<input
										checked={methods.includes(method)}
										onChange={event => toggleMethod(method, event.currentTarget.checked)}
										type="checkbox"
									/>
									{t(`admin.units.config.method.${method}`)}
								</label>
							))}
						</div>
					</div>

					<div className="space-y-2">
						<span className="font-medium text-sm">{t("admin.units.config.deliveryFee")}</span>
						<NumericInput
							decimalScale={2}
							decimalSeparator=","
							onValueChange={({ floatValue }) => setFeeReais(floatValue ?? 0)}
							placeholder="R$ 10,00"
							prefix="R$ "
							thousandSeparator="."
							value={feeReais}
						/>
						<label className="flex items-center gap-2 text-muted-foreground text-xs">
							<input
								checked={feeFallbackEnabled}
								onChange={event => setFeeFallbackEnabled(event.currentTarget.checked)}
								type="checkbox"
							/>
							{t("admin.units.config.deliveryFeeFallback")}
						</label>
					</div>

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
									<span className="text-muted-foreground text-xs">
										{t("admin.units.deliveryZones.etaMin")}
									</span>
									<NumericInput
										className="w-20"
										decimalScale={0}
										onValueChange={({ floatValue }) => update(index, { etaMinMinutes: floatValue ?? null })}
										placeholder="20"
										suffix=" min"
										value={row.etaMinMinutes ?? 0}
									/>
								</div>
								<div className="space-y-1">
									<span className="text-muted-foreground text-xs">
										{t("admin.units.deliveryZones.etaMax")}
									</span>
									<NumericInput
										className="w-20"
										decimalScale={0}
										onValueChange={({ floatValue }) => update(index, { etaMaxMinutes: floatValue ?? null })}
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
