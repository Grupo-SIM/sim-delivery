import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/Checkbox";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetCategories, useGetTags } from "@/lib/api";

interface CreateProductConfigurationProps {
	categoryIds: string[];
	onCategoryIdsChange: (ids: string[]) => void;
	onTagIdsChange: (ids: string[]) => void;
	tagIds: string[];
}

function toggleId(ids: string[], id: string) {
	return ids.includes(id) ? ids.filter(currentId => currentId !== id) : [...ids, id];
}

export function CreateProductConfiguration({
	categoryIds,
	onCategoryIdsChange,
	onTagIdsChange,
	tagIds,
}: CreateProductConfigurationProps) {
	const { t } = useTranslation();
	const fieldId = useId();
	const categoriesQuery = useGetCategories();
	const tagsQuery = useGetTags();

	return (
		<section className="grid gap-4 md:grid-cols-2">
			<div className="space-y-2">
				<span className="font-medium text-sm">{t("admin.products.taxonomy.categories")}</span>
				{categoriesQuery.isPending ? (
					<div className="space-y-2">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
					</div>
				) : categoriesQuery.isError ? (
					<p className="text-destructive text-sm">{t("admin.products.taxonomy.loadError")}</p>
				) : (
					<div className="max-h-32 space-y-1 overflow-auto rounded-md border border-border p-2">
						{categoriesQuery.data?.map(category => (
							<label
								className="flex cursor-pointer items-center gap-2 text-sm"
								htmlFor={`${fieldId}-category-${category.id}`}
								key={category.id}
							>
								<Checkbox
									checked={categoryIds.includes(category.id)}
									id={`${fieldId}-category-${category.id}`}
									onChange={() => onCategoryIdsChange(toggleId(categoryIds, category.id))}
								/>
								{category.name}
							</label>
						))}
					</div>
				)}
			</div>
			<div className="space-y-2">
				<span className="font-medium text-sm">{t("admin.products.taxonomy.tags")}</span>
				{tagsQuery.isPending ? (
					<div className="space-y-2">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
					</div>
				) : tagsQuery.isError ? (
					<p className="text-destructive text-sm">{t("admin.products.taxonomy.loadError")}</p>
				) : (
					<div className="max-h-32 space-y-1 overflow-auto rounded-md border border-border p-2">
						{tagsQuery.data?.map(tag => (
							<label
								className="flex cursor-pointer items-center gap-2 text-sm"
								htmlFor={`${fieldId}-tag-${tag.id}`}
								key={tag.id}
							>
								<Checkbox
									checked={tagIds.includes(tag.id)}
									id={`${fieldId}-tag-${tag.id}`}
									onChange={() => onTagIdsChange(toggleId(tagIds, tag.id))}
								/>
								<span aria-hidden className="size-3 rounded-full" style={{ backgroundColor: tag.color }} />
								{tag.name}
							</label>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
