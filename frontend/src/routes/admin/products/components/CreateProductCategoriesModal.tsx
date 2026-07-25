import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetCategories } from "@/lib/api";

interface CreateProductCategoriesModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (categoryIds: string[]) => void;
	selectedCategoryIds: string[];
}

export function CreateProductCategoriesModal({
	isOpen,
	onClose,
	onSave,
	selectedCategoryIds,
}: CreateProductCategoriesModalProps) {
	const { t } = useTranslation();
	const { data: categories, isPending } = useGetCategories();
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	useEffect(() => {
		setSelectedIds(selectedCategoryIds);
	}, [selectedCategoryIds]);

	function toggle(categoryId: string) {
		setSelectedIds(ids =>
			ids.includes(categoryId) ? ids.filter(id => id !== categoryId) : [...ids, categoryId],
		);
	}

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={t("admin.products.create.categoriesModalTitle")}>
			<div className="space-y-4">
				{isPending ? (
					<div className="space-y-2">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
					</div>
				) : categories && categories.length > 0 ? (
					<div className="max-h-72 space-y-2 overflow-y-auto">
						{categories.map(category => (
							<label
								className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent p-2 text-sm hover:border-border hover:bg-muted/40"
								htmlFor={`create-category-${category.id}`}
								key={category.id}
							>
								<Checkbox
									checked={selectedIds.includes(category.id)}
									id={`create-category-${category.id}`}
									onChange={() => toggle(category.id)}
								/>
								<span>{category.name}</span>
							</label>
						))}
					</div>
				) : (
					<p className="text-muted-foreground text-sm">{t("admin.products.create.categoriesEmpty")}</p>
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
