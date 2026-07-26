import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	type GetUnits200,
	getUnitsByUnitIdPromotionalImagesQueryKey,
	useGetPromotionalImages,
	useGetUnitsByUnitIdPromotionalImages,
	usePutUnitsByUnitIdPromotionalImages,
} from "@/lib/api";

interface UnitPromotionalImagesEditorProps {
	onClose: () => void;
	unit: GetUnits200[number] | null;
}

export function UnitPromotionalImagesEditor({ onClose, unit }: UnitPromotionalImagesEditorProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [selected, setSelected] = useState<string[]>([]);
	const { data: images, isPending: imagesPending } = useGetPromotionalImages();
	const { data: assigned, isPending: assignedPending } = useGetUnitsByUnitIdPromotionalImages(unit?.id);
	const save = usePutUnitsByUnitIdPromotionalImages();

	useEffect(() => setSelected(assigned?.map(image => image.id) ?? []), [assigned]);
	function toggle(id: string) {
		setSelected(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]));
	}
	function submit() {
		if (!unit) return;
		save.mutate(
			{ data: { promotionalImageIds: selected }, unitId: unit.id },
			{
				onSuccess: async () => {
					await queryClient.invalidateQueries({
						queryKey: getUnitsByUnitIdPromotionalImagesQueryKey(unit.id),
					});
					onClose();
				},
			},
		);
	}

	return (
		<Modal
			isOpen={unit !== null}
			maxWidth="760px"
			onClose={onClose}
			title={t("admin.units.promotionalImages.title")}
		>
			<div className="space-y-4">
				{imagesPending || assignedPending ? (
					<div className="space-y-2">
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
					</div>
				) : images?.length === 0 ? (
					<p className="text-muted-foreground text-sm">{t("admin.units.promotionalImages.empty")}</p>
				) : (
					<div className="max-h-80 space-y-2 overflow-y-auto">
						{images?.map(image => (
							<label
								className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-2"
								htmlFor={`unit-promotion-${image.id}`}
								key={image.id}
							>
								<Checkbox
									checked={selected.includes(image.id)}
									id={`unit-promotion-${image.id}`}
									onChange={() => toggle(image.id)}
								/>
								<img alt="" className="h-12 w-20 rounded object-cover" src={image.imageUrl} />
								<span className="text-sm">{image.title}</span>
							</label>
						))}
					</div>
				)}
				<div className="flex justify-end gap-2">
					<Button onClick={onClose} type="button" variant="outline">
						{t("actions.cancel")}
					</Button>
					<Button
						disabled={save.isPending || imagesPending || assignedPending}
						onClick={submit}
						type="button"
					>
						{t("actions.confirm")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
