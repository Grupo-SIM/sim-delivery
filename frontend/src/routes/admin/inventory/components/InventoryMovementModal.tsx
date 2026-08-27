import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { RequiredMark } from "@/components/ui/label";
import { Modal } from "@/components/ui/Modal";
import { NumericInput } from "@/components/ui/NumericInput";
import { TextField } from "@/components/ui/TextField";
import {
	getInventoryOverviewQueryKey,
	useGetInventoryItems,
	useGetUnits,
	usePostInventoryMovements,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";

export function InventoryMovementModal({
	initialInventoryItemId = "",
	initialType,
	initialUnitId = "",
	isOpen,
	onClose,
}: {
	initialInventoryItemId?: string;
	initialType?: "entry" | "adjustment" | "loss";
	initialUnitId?: string;
	isOpen: boolean;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const client = useQueryClient();
	const { data: items = [] } = useGetInventoryItems({ active: true });
	const { data: units = [] } = useGetUnits();
	const mutation = usePostInventoryMovements();
	const [inventoryItemId, setInventoryItemId] = useState(initialInventoryItemId);
	const [unitId, setUnitId] = useState(initialUnitId);
	const [type, setType] = useState<"entry" | "adjustment" | "loss">(initialType ?? "entry");
	const [quantity, setQuantity] = useState(0);
	const [totalCostCents, setTotalCostCents] = useState(0);
	const [reason, setReason] = useState("");

	function close() {
		setInventoryItemId(initialInventoryItemId);
		setUnitId(initialUnitId);
		setType(initialType ?? "entry");
		setQuantity(0);
		setTotalCostCents(0);
		setReason("");
		onClose();
	}

	function submit() {
		mutation.mutate(
			{
				data: {
					inventoryItemId,
					quantity,
					reason,
					type,
					...(type === "entry" ? { unitCostCents: Math.round(totalCostCents / quantity) } : {}),
					unitId,
				},
			},
			{
				onError: () => void showAlert(t("admin.inventory.movement.error")),
				onSuccess: () => {
					void client.invalidateQueries({ queryKey: getInventoryOverviewQueryKey() });
					showToast(t("admin.inventory.movement.success"), "positive");
					close();
				},
			},
		);
	}

	const itemIsKnown = Boolean(initialInventoryItemId);
	const unitIsKnown = Boolean(initialUnitId);
	const typeIsKnown = initialType !== undefined;
	const requiresTotalCost = type === "entry";

	return (
		<Modal
			isOpen={isOpen}
			onClose={close}
			title={t(itemIsKnown ? "admin.inventory.movement.quickTitle" : "admin.inventory.movement.title")}
			urlKey="inventory-movement"
		>
			<div className="space-y-4">
				{!unitIsKnown && (
					<div>
						<span className="mb-1 block font-medium text-sm">
							{t("admin.inventory.fields.unit")} <RequiredMark />
						</span>
						<CustomSelect
							onChange={setUnitId}
							options={units.map(unit => ({ label: unit.name, value: unit.id }))}
							value={unitId}
						/>
					</div>
				)}
				{!itemIsKnown && (
					<div>
						<span className="mb-1 block font-medium text-sm">
							{t("admin.inventory.fields.item")} <RequiredMark />
						</span>
						<CustomSelect
							onChange={setInventoryItemId}
							options={items.map(item => ({ label: item.name, value: item.id }))}
							value={inventoryItemId}
						/>
					</div>
				)}
				{!typeIsKnown && (
					<div>
						<span className="mb-1 block font-medium text-sm">
							{t("admin.inventory.fields.type")} <RequiredMark />
						</span>
						<CustomSelect
							onChange={value => setType(value as typeof type)}
							options={[
								{ label: t("admin.inventory.types.entry"), value: "entry" },
								{ label: t("admin.inventory.types.adjustment"), value: "adjustment" },
								{ label: t("admin.inventory.types.loss"), value: "loss" },
							]}
							value={type}
						/>
					</div>
				)}
				<div>
					<span className="mb-1 block font-medium text-sm">
						{t("admin.inventory.fields.quantity")} <RequiredMark />
					</span>
					<NumericInput
						decimalScale={3}
						onValueChange={({ floatValue }) => setQuantity(floatValue)}
						placeholder="Ex: 10,000"
						value={quantity}
					/>
				</div>
				{requiresTotalCost && (
					<div>
						<span className="mb-1 block font-medium text-sm">
							{t("admin.inventory.fields.totalCost")} <RequiredMark />
						</span>
						<NumericInput
							decimalScale={2}
							onValueChange={({ floatValue }) => setTotalCostCents(Math.round(floatValue * 100))}
							placeholder="R$ 100,00"
							prefix="R$ "
							value={totalCostCents / 100}
						/>
					</div>
				)}
				<TextField
					label={t("admin.inventory.fields.reason")}
					onValueChange={setReason}
					placeholder="Ex: Compra semanal"
					value={reason}
				/>
				<div className="flex justify-end gap-2">
					<Button onClick={close} type="button" variant="outline">
						{t("actions.cancel")}
					</Button>
					<Button
						disabled={
							!unitId ||
							!inventoryItemId ||
							quantity <= 0 ||
							(requiresTotalCost && totalCostCents <= 0) ||
							mutation.isPending
						}
						onClick={submit}
						type="button"
					>
						{t("admin.inventory.actions.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
