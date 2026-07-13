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
	const [cashback, setCashback] = useState(0);
	const [availability, setAvailability] = useState<Availability>("auto");

	useEffect(() => {
		if (!unit) {
			return;
		}
		setCashback(unit.cashbackPercent);
		setAvailability(toAvailability(unit.isOpenManual));
	}, [unit]);

	function save() {
		if (!unit) {
			return;
		}
		mutate(
			{
				data: {
					cashbackPercent: cashback,
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
