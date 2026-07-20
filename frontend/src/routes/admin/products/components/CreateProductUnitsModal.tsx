import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetUnits } from "@/lib/api";

interface CreateProductUnitsModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (unitIds: string[]) => void;
	selectedUnitIds: string[] | null;
}

export function CreateProductUnitsModal({
	isOpen,
	onClose,
	onSave,
	selectedUnitIds,
}: CreateProductUnitsModalProps) {
	const { t } = useTranslation();
	const { data: units, isPending } = useGetUnits();
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	useEffect(() => {
		setSelectedIds(selectedUnitIds ?? units?.map(unit => unit.id) ?? []);
	}, [selectedUnitIds, units]);

	function toggle(unitId: string) {
		setSelectedIds(ids => (ids.includes(unitId) ? ids.filter(id => id !== unitId) : [...ids, unitId]));
	}

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={t("admin.products.create.unitsModalTitle")}>
			<div className="space-y-4">
				{isPending ? (
					<div className="space-y-2">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
					</div>
				) : (
					<div className="max-h-72 space-y-2 overflow-y-auto">
						{units?.map(unit => (
							<label
								className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent p-2 text-sm hover:border-border hover:bg-muted/40"
								htmlFor={`create-unit-${unit.id}`}
								key={unit.id}
							>
								<Checkbox
									checked={selectedIds.includes(unit.id)}
									id={`create-unit-${unit.id}`}
									onChange={() => toggle(unit.id)}
								/>
								<span>{unit.name}</span>
							</label>
						))}
					</div>
				)}
				<div className="flex justify-end gap-2">
					<Button onClick={onClose} type="button" variant="outline">
						{t("admin.products.create.modalCancel")}
					</Button>
					<Button disabled={isPending} onClick={() => onSave(selectedIds)} type="button">
						{t("admin.products.create.modalSave")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
