import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { getInventoryItemsQueryKey, getInventoryOverviewQueryKey, usePostInventoryItems } from "@/lib/api";
import { showAlert, showToast } from "@/stores";

export function CreateInventoryItemModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const { t } = useTranslation();
	const client = useQueryClient();
	const mutation = usePostInventoryItems();
	const [name, setName] = useState("");
	const [unit, setUnit] = useState<"unit" | "gram" | "milliliter">("unit");
	function close() {
		setName("");
		setUnit("unit");
		onClose();
	}
	function submit() {
		mutation.mutate(
			{ data: { name, unit } },
			{
				onError: () => void showAlert(t("admin.inventory.item.error")),
				onSuccess: () => {
					void client.invalidateQueries({ queryKey: getInventoryItemsQueryKey() });
					void client.invalidateQueries({ queryKey: getInventoryOverviewQueryKey() });
					showToast(t("admin.inventory.item.success"), "positive");
					close();
				},
			},
		);
	}
	return (
		<Modal isOpen={isOpen} onClose={close} title={t("admin.inventory.item.title")} urlKey="inventory-item-create">
			<div className="space-y-4">
				<TextField
					label={t("admin.inventory.fields.name")}
					onValueChange={setName}
					placeholder="Ex: Farinha de trigo"
					value={name}
				/>
				<div>
					<span className="mb-1 block font-medium text-sm">{t("admin.inventory.fields.measureUnit")}</span>
					<CustomSelect
						onChange={value => setUnit(value as typeof unit)}
						options={[
							{ label: t("admin.inventory.units.unit"), value: "unit" },
							{ label: t("admin.inventory.units.gram"), value: "gram" },
							{ label: t("admin.inventory.units.milliliter"), value: "milliliter" },
						]}
						value={unit}
					/>
				</div>
				<div className="flex justify-end gap-2">
					<Button onClick={close} type="button" variant="outline">
						{t("actions.cancel")}
					</Button>
					<Button disabled={!name.trim() || mutation.isPending} onClick={submit} type="button">
						{t("admin.inventory.actions.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
