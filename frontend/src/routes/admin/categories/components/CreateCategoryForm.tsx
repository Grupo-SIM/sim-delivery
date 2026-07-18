import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import {
	getCategoriesQueryKey,
	getUnitsByUnitIdCategoriesQueryKey,
	useGetUnits,
	usePostCategories,
	usePutCategoriesByCategoryIdUnits,
} from "@/lib/api";

export function CreateCategoryForm() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [unitIds, setUnitIds] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isUploadingImage, setIsUploadingImage] = useState(false);

	const { data: units } = useGetUnits();
	const { isPending, mutate } = usePostCategories();
	const { mutateAsync: setCategoryUnits } = usePutCategoriesByCategoryIdUnits();

	function toggleUnit(unitId: string) {
		setUnitIds(current =>
			current.includes(unitId) ? current.filter(id => id !== unitId) : [...current, unitId],
		);
	}

	async function invalidate() {
		await queryClient.invalidateQueries({ queryKey: getCategoriesQueryKey() });
		await Promise.all(
			unitIds.map(unitId =>
				queryClient.invalidateQueries({ queryKey: getUnitsByUnitIdCategoriesQueryKey(unitId) }),
			),
		);
	}

	return (
		<form
			className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
			onSubmit={event => {
				event.preventDefault();
				setError(null);
				mutate(
					{ data: { imageUrl, name } },
					{
						onError: () => setError(t("admin.categories.create.error")),
						onSuccess: async category => {
							if (unitIds.length > 0) {
								await setCategoryUnits({ categoryId: category.id, data: { unitIds } });
							}
							setName("");
							setImageUrl("");
							setUnitIds([]);
							await invalidate();
						},
					},
				);
			}}
		>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end">
				<Label className="flex-1">
					<span>
						{t("admin.categories.create.name")} <RequiredMark />
					</span>
					<Input
						onChange={event => setName(event.currentTarget.value)}
						placeholder={t("admin.categories.create.namePlaceholder")}
						required
						value={name}
					/>
				</Label>
				<Label className="flex-1">
					<span>{t("admin.categories.create.image")}</span>
					<MediaUrlInput
						asset="category"
						onUploadError={() => setError(t("admin.categories.create.uploadError"))}
						onUploadingChange={setIsUploadingImage}
						onValueChange={setImageUrl}
						placeholder={t("admin.categories.create.imagePlaceholder")}
						uploadLabel={t("admin.categories.create.imageUpload")}
						value={imageUrl}
					/>
				</Label>
				<Button disabled={isPending || isUploadingImage || !name} type="submit">
					{isPending ? t("admin.categories.create.submitting") : t("admin.categories.create.submit")}
				</Button>
			</div>

			{units && units.length > 0 && (
				<div className="space-y-2">
					<span className="font-medium text-sm">{t("admin.categories.create.units")}</span>
					<div className="flex flex-wrap gap-3">
						{units.map(unit => (
							<div className="flex items-center gap-2 text-sm" key={unit.id}>
								<Checkbox
									checked={unitIds.includes(unit.id)}
									id={`create-category-unit-${unit.id}`}
									onChange={() => toggleUnit(unit.id)}
								/>
								<label htmlFor={`create-category-unit-${unit.id}`}>{unit.name}</label>
							</div>
						))}
					</div>
				</div>
			)}

			{error && <p className="text-destructive text-xs">{error}</p>}
		</form>
	);
}
