import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { Modal } from "@/components/ui/Modal";
import {
	type GetUnits200,
	getCategoriesByCategoryIdUnitsQueryKey,
	getCategoriesQueryKey,
	getUnitsByUnitIdCategoriesQueryKey,
	useDeleteCategoriesByCategoryId,
	useGetCategoriesByCategoryIdUnits,
	usePatchCategoriesByCategoryId,
	usePutCategoriesByCategoryIdUnits,
} from "@/lib/api";
import { showAlert, showConfirm } from "@/stores";

interface CategoryEditModalProps {
	category: { id: string; imageUrl: string; name: string } | null;
	onClose: () => void;
	units: GetUnits200;
}

export function CategoryEditModal({ category, onClose, units }: CategoryEditModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [unitIds, setUnitIds] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);

	const { data: linkedUnitIds } = useGetCategoriesByCategoryIdUnits(category?.id);
	const { isPending: isSaving, mutateAsync: updateCategory } = usePatchCategoriesByCategoryId();
	const { mutateAsync: setCategoryUnits } = usePutCategoriesByCategoryIdUnits();
	const removeCategory = useDeleteCategoriesByCategoryId();

	useEffect(() => {
		setName(category?.name ?? "");
		setImageUrl(category?.imageUrl ?? "");
		setError(null);
	}, [category]);

	useEffect(() => {
		setUnitIds(linkedUnitIds ?? []);
	}, [linkedUnitIds]);

	function toggleUnit(unitId: string) {
		setUnitIds(current =>
			current.includes(unitId) ? current.filter(id => id !== unitId) : [...current, unitId],
		);
	}

	async function invalidate(affectedUnitIds: string[]) {
		if (!category) return;
		await queryClient.invalidateQueries({ queryKey: getCategoriesQueryKey() });
		await queryClient.invalidateQueries({ queryKey: getCategoriesByCategoryIdUnitsQueryKey(category.id) });
		await Promise.all(
			[...new Set(affectedUnitIds)].map(unitId =>
				queryClient.invalidateQueries({ queryKey: getUnitsByUnitIdCategoriesQueryKey(unitId) }),
			),
		);
	}

	async function save() {
		if (!category) return;
		setError(null);
		try {
			await updateCategory({ categoryId: category.id, data: { imageUrl, name } });
			await setCategoryUnits({ categoryId: category.id, data: { unitIds } });
			await invalidate([...(linkedUnitIds ?? []), ...unitIds]);
			onClose();
		} catch {
			setError(t("admin.categories.edit.error"));
		}
	}

	async function del() {
		if (!category) return;
		if (!(await showConfirm(t("admin.categories.edit.deleteConfirm", { name: category.name })))) {
			return;
		}
		removeCategory.mutate(
			{ categoryId: category.id },
			{
				onError: () => void showAlert(t("admin.categories.edit.deleteError")),
				onSuccess: async () => {
					await invalidate(linkedUnitIds ?? []);
					onClose();
				},
			},
		);
	}

	return (
		<Modal isOpen={category !== null} onClose={onClose} title={t("admin.categories.edit.title")}>
			<div className="space-y-4">
				<Label>
					<span>{t("admin.categories.create.name")}</span>
					<Input onChange={event => setName(event.currentTarget.value)} value={name} />
				</Label>

				<Label>
					<span>{t("admin.categories.create.image")}</span>
					<MediaUrlInput
						asset="category"
						onUploadError={() => setError(t("admin.categories.create.uploadError"))}
						onValueChange={setImageUrl}
						placeholder={t("admin.categories.create.imagePlaceholder")}
						uploadLabel={t("admin.categories.create.imageUpload")}
						value={imageUrl}
					/>
				</Label>

				{units.length > 0 && (
					<div className="space-y-2">
						<span className="font-medium text-sm">{t("admin.categories.edit.units")}</span>
						<div className="flex flex-wrap gap-3">
							{units.map(unit => (
								<div className="flex items-center gap-2 text-sm" key={unit.id}>
									<Checkbox
										checked={unitIds.includes(unit.id)}
										id={`edit-category-unit-${unit.id}`}
										onChange={() => toggleUnit(unit.id)}
									/>
									<label htmlFor={`edit-category-unit-${unit.id}`}>{unit.name}</label>
								</div>
							))}
						</div>
					</div>
				)}

				{error && <p className="text-destructive text-xs">{error}</p>}

				<div className="flex items-center justify-between gap-2 pt-2">
					<Button disabled={removeCategory.isPending} onClick={del} type="button" variant="outline">
						{t("admin.categories.edit.delete")}
					</Button>
					<div className="flex gap-2">
						<Button disabled={isSaving} onClick={onClose} type="button" variant="outline">
							{t("admin.categories.edit.cancel")}
						</Button>
						<Button disabled={isSaving || !name} onClick={save} type="button">
							{isSaving ? t("admin.categories.edit.saving") : t("admin.categories.edit.save")}
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
}
