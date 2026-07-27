import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { NumericInput } from "@/components/ui/NumericInput";
import { TextField } from "@/components/ui/TextField";
import { getInventoryOverviewQueryKey, useGetInventoryItems, useGetUnits, usePostInventoryMovements } from "@/lib/api";
import { showAlert, showToast } from "@/stores";

export function InventoryMovementModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const { t } = useTranslation();
	const client = useQueryClient();
	const { data: items = [] } = useGetInventoryItems({ active: true });
	const { data: units = [] } = useGetUnits();
	const mutation = usePostInventoryMovements();
	const [inventoryItemId, setInventoryItemId] = useState("");
	const [unitId, setUnitId] = useState("");
	const [type, setType] = useState<"entry" | "adjustment" | "loss">("entry");
	const [quantity, setQuantity] = useState(0);
	const [unitCostCents, setUnitCostCents] = useState(0);
	const [reason, setReason] = useState("");
	function close() {
		setInventoryItemId("");
		setUnitId("");
		setType("entry");
		setQuantity(0);
		setUnitCostCents(0);
		setReason("");
		onClose();
	}

	function submit() {
		mutation.mutate({ data: { inventoryItemId, quantity, reason, type, unitCostCents: type === "entry" ? unitCostCents : undefined, unitId } }, {
			onError: () => void showAlert(t("admin.inventory.movement.error")),
			onSuccess: () => {
				void client.invalidateQueries({ queryKey: getInventoryOverviewQueryKey() });
				showToast(t("admin.inventory.movement.success"), "positive");
				close();
			},
		});
	}

	return <Modal isOpen={isOpen} onClose={close} title={t("admin.inventory.movement.title")}>
		<div className="space-y-4">
			<div><span className="mb-1 block font-medium text-sm">{t("admin.inventory.fields.unit")}</span><CustomSelect onChange={setUnitId} options={units.map(unit => ({ label: unit.name, value: unit.id }))} value={unitId} /></div>
			<div><span className="mb-1 block font-medium text-sm">{t("admin.inventory.fields.item")}</span><CustomSelect onChange={setInventoryItemId} options={items.map(item => ({ label: item.name, value: item.id }))} value={inventoryItemId} /></div>
			<div><span className="mb-1 block font-medium text-sm">{t("admin.inventory.fields.type")}</span><CustomSelect onChange={value => setType(value as typeof type)} options={[{ label: t("admin.inventory.types.entry"), value: "entry" }, { label: t("admin.inventory.types.adjustment"), value: "adjustment" }, { label: t("admin.inventory.types.loss"), value: "loss" }]} value={type} /></div>
			<div><span className="mb-1 block font-medium text-sm">{t("admin.inventory.fields.quantity")}</span><NumericInput decimalScale={3} onValueChange={({ floatValue }) => setQuantity(floatValue)} placeholder="Ex: 10,000" value={quantity} /></div>
			{type === "entry" && <div><span className="mb-1 block font-medium text-sm">{t("admin.inventory.fields.unitCost")}</span><NumericInput decimalScale={2} onValueChange={({ floatValue }) => setUnitCostCents(Math.round(floatValue * 100))} placeholder="R$ 10,00" prefix="R$ " value={unitCostCents / 100} /></div>}
			<TextField label={t("admin.inventory.fields.reason")} onValueChange={setReason} placeholder="Ex: Compra semanal" value={reason} />
			<div className="flex justify-end gap-2"><Button onClick={close} type="button" variant="outline">{t("actions.cancel")}</Button><Button disabled={!unitId || !inventoryItemId || !reason || quantity === 0 || mutation.isPending} onClick={submit} type="button">{t("admin.inventory.actions.save")}</Button></div>
		</div>
	</Modal>;
}
