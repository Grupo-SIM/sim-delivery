import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import {
	type GetPromotionalImages200,
	getPromotionalImagesByPromotionalImageIdUnitsQueryKey,
	useGetPromotionalImagesByPromotionalImageIdUnits,
	useGetUnits,
	usePutPromotionalImagesByPromotionalImageIdUnits,
} from "@/lib/api";

type PromotionalImage = GetPromotionalImages200[number];

interface PromotionalImageUnitsModalProps {
	image: PromotionalImage | null;
	onClose: () => void;
}

export function PromotionalImageUnitsModal({ image, onClose }: PromotionalImageUnitsModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [selected, setSelected] = useState<string[]>([]);
	const { data: units } = useGetUnits();
	const { data: assigned } = useGetPromotionalImagesByPromotionalImageIdUnits(image?.id);
	const save = usePutPromotionalImagesByPromotionalImageIdUnits();

	useEffect(() => setSelected(assigned ?? []), [assigned]);

	function toggle(unitId: string) {
		setSelected(current =>
			current.includes(unitId) ? current.filter(id => id !== unitId) : [...current, unitId],
		);
	}

	function submit() {
		if (!image) return;
		save.mutate(
			{ data: { unitIds: selected }, promotionalImageId: image.id },
			{
				onSuccess: async () => {
					await queryClient.invalidateQueries({
						queryKey: getPromotionalImagesByPromotionalImageIdUnitsQueryKey(image.id),
					});
					onClose();
				},
			},
		);
	}

	return (
		<Modal isOpen={image !== null} onClose={onClose} title={t("admin.promotionalImages.units.title")}>
			<div className="space-y-4">
				<div className="max-h-72 space-y-2 overflow-y-auto">
					{units?.map(unit => (
						<div className="flex items-center gap-2 text-sm" key={unit.id}>
							<Checkbox
								checked={selected.includes(unit.id)}
								id={`promotion-unit-${unit.id}`}
								onChange={() => toggle(unit.id)}
							/>
							<label htmlFor={`promotion-unit-${unit.id}`}>{unit.name}</label>
						</div>
					))}
				</div>
				<div className="flex justify-end gap-2">
					<Button onClick={onClose} type="button" variant="outline">
						{t("actions.cancel")}
					</Button>
					<Button disabled={save.isPending} onClick={submit} type="button">
						{t("actions.confirm")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
