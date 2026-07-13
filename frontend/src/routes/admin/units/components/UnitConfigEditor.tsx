import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { NumericInput } from "@/components/ui/NumericInput";
import { type GetUnits200, getUnitsQueryKey, usePatchUnitsByUnitId } from "@/lib/api";
import { showAlert } from "@/stores";

type Unit = GetUnits200[number];
type DeliveryMethod = "delivery" | "pickup";
const METHODS: DeliveryMethod[] = ["delivery", "pickup"];

type Availability = "auto" | "closed" | "open";
const toAvailability = (isOpenManual: boolean | null): Availability =>
	isOpenManual === null ? "auto" : isOpenManual ? "open" : "closed";
const toIsOpenManual = (availability: Availability): boolean | null =>
	availability === "auto" ? null : availability === "open";

interface UnitConfigEditorProps {
	onClose: () => void;
	unit: Unit | null;
}

export function UnitConfigEditor({ onClose, unit }: UnitConfigEditorProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { isPending: isSaving, mutate } = usePatchUnitsByUnitId();
	const [methods, setMethods] = useState<DeliveryMethod[]>([]);
	const [feeReais, setFeeReais] = useState(0);
	const [feeFallbackEnabled, setFeeFallbackEnabled] = useState(true);
	const [cashback, setCashback] = useState(0);
	const [availability, setAvailability] = useState<Availability>("auto");

	useEffect(() => {
		if (!unit) {
			return;
		}
		setMethods(METHODS.filter(method => unit.deliveryMethods.includes(method)));
		setFeeReais(Number(unit.deliveryFee) / 100);
		setFeeFallbackEnabled(unit.deliveryFeeFallbackEnabled);
		setCashback(unit.cashbackPercent);
		setAvailability(toAvailability(unit.isOpenManual));
	}, [unit]);

	function toggleMethod(method: DeliveryMethod, checked: boolean) {
		setMethods(prev => (checked ? [...new Set([...prev, method])] : prev.filter(m => m !== method)));
	}

	function save() {
		if (!unit) {
			return;
		}
		mutate(
			{
				data: {
					cashbackPercent: cashback,
					deliveryFee: Math.round(feeReais * 100),
					deliveryFeeFallbackEnabled: feeFallbackEnabled,
					deliveryMethods: methods,
					isOpenManual: toIsOpenManual(availability),
				},
				unitId: unit.id,
			},
			{
				onError: () => void showAlert(t("admin.units.config.error")),
				onSuccess: async () => {
					await queryClient.invalidateQueries({ queryKey: getUnitsQueryKey() });
					onClose();
				},
			},
		);
	}

	return (
		<Modal isOpen={unit !== null} onClose={onClose} title={t("admin.units.config.title")}>
			<div className="space-y-4">
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

				<div className="space-y-2">
					<span className="font-medium text-sm">{t("admin.units.config.cashback")}</span>
					<NumericInput
						decimalScale={2}
						decimalSeparator=","
						onValueChange={({ floatValue }) => setCashback(floatValue ?? 0)}
						placeholder="5 %"
						suffix=" %"
						value={cashback}
					/>
				</div>

				<div className="space-y-2">
					<span className="font-medium text-sm">{t("admin.units.config.availability")}</span>
					<CustomSelect
						onChange={value => setAvailability(value as Availability)}
						options={[
							{ label: t("admin.units.config.availabilityAuto"), value: "auto" },
							{ label: t("admin.units.config.availabilityOpen"), value: "open" },
							{ label: t("admin.units.config.availabilityClosed"), value: "closed" },
						]}
						value={availability}
					/>
				</div>

				<div className="flex justify-end gap-2 pt-2">
					<Button onClick={onClose} type="button" variant="outline">
						{t("admin.units.config.cancel")}
					</Button>
					<Button disabled={isSaving} onClick={save} type="button">
						{isSaving ? t("admin.units.config.saving") : t("admin.units.config.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
