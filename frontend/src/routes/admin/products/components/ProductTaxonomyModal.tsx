import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ColorField } from "@/components/ui/ColorField";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	type GetProducts200,
	getCategoriesQueryKey,
	getProductsQueryKey,
	getTagsQueryKey,
	useGetCategories,
	useGetTags,
	usePatchProductsByProductId,
	usePostCategories,
	usePostTags,
} from "@/lib/api";

interface ProductTaxonomyModalProps {
	onClose: () => void;
	product: GetProducts200[number] | null;
}

function toggleId(ids: string[], id: string) {
	return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
}

export function ProductTaxonomyModal({ onClose, product }: ProductTaxonomyModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const categoriesQuery = useGetCategories();
	const tagsQuery = useGetTags();
	const update = usePatchProductsByProductId();
	const createCategory = usePostCategories();
	const createTag = usePostTags();
	const [categoryIds, setCategoryIds] = useState<string[]>([]);
	const [tagIds, setTagIds] = useState<string[]>([]);
	const [categoryName, setCategoryName] = useState("");
	const [localCategoryName, setLocalCategoryName, flushCategoryName] = useDebouncedInput(
		categoryName,
		setCategoryName,
	);
	const [tagName, setTagName] = useState("");
	const [localTagName, setLocalTagName, flushTagName] = useDebouncedInput(tagName, setTagName);
	const [tagColor, setTagColor] = useState("#000000");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!product) return;
		setCategoryIds(product.categories.map(category => category.id));
		setTagIds(product.tags.map(tag => tag.id));
		setError(null);
	}, [product]);

	async function invalidateTaxonomy() {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: getCategoriesQueryKey() }),
			queryClient.invalidateQueries({ queryKey: getTagsQueryKey() }),
		]);
	}

	function addCategory() {
		flushCategoryName();
		if (!localCategoryName.trim()) return;
		createCategory.mutate(
			{ data: { name: localCategoryName.trim() } },
			{
				onError: () => setError(t("admin.products.taxonomy.createCategoryError")),
				onSuccess: async category => {
					setCategoryIds(ids => [...ids, category.id]);
					setCategoryName("");
					await invalidateTaxonomy();
				},
			},
		);
	}

	function addTag() {
		flushTagName();
		if (!localTagName.trim()) return;
		createTag.mutate(
			{ data: { color: tagColor, name: localTagName.trim() } },
			{
				onError: () => setError(t("admin.products.taxonomy.createTagError")),
				onSuccess: async tag => {
					setTagIds(ids => [...ids, tag.id]);
					setTagName("");
					await invalidateTaxonomy();
				},
			},
		);
	}

	function save() {
		if (!product) return;
		setError(null);
		update.mutate(
			{ data: { categoryIds, tagIds }, productId: product.id },
			{
				onError: () => setError(t("admin.products.taxonomy.error")),
				onSuccess: async updatedProduct => {
					queryClient.setQueryData<GetProducts200>(getProductsQueryKey(), current =>
						current?.map(item => (item.id === updatedProduct.id ? updatedProduct : item)),
					);
					await queryClient.refetchQueries({ exact: true, queryKey: getProductsQueryKey() });
					await invalidateTaxonomy();
					onClose();
				},
			},
		);
	}

	const pending = categoriesQuery.isPending || tagsQuery.isPending;
	return (
		<Modal
			isOpen={product !== null}
			maxWidth="760px"
			onClose={onClose}
			title={t("admin.products.taxonomy.title", { title: product?.title })}
		>
			<div className="space-y-5">
				{pending ? (
					<div className="grid gap-4 md:grid-cols-2">
						<Skeleton className="h-64" />
						<Skeleton className="h-64" />
					</div>
				) : (
					<div className="grid gap-5 md:grid-cols-2">
						<section className="space-y-3 rounded-lg border border-border p-4">
							<div>
								<h3 className="font-semibold">{t("admin.products.taxonomy.categories")}</h3>
								<p className="text-muted-foreground text-sm">{t("admin.products.taxonomy.categoriesHint")}</p>
							</div>
							<ScrollArea className="max-h-52 space-y-2 overflow-y-auto">
								{categoriesQuery.data?.map(category => (
									<div
										className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent p-2 hover:border-border hover:bg-muted/40"
										key={category.id}
									>
										<Checkbox
											checked={categoryIds.includes(category.id)}
											id={`category-${category.id}`}
											onChange={() => setCategoryIds(ids => toggleId(ids, category.id))}
										/>
										<label className="flex-1 cursor-pointer text-sm" htmlFor={`category-${category.id}`}>
											{category.name}
										</label>
										<Badge tone="neutral">{category.products.length}</Badge>
									</div>
								))}
							</ScrollArea>
							<div className="flex gap-2 border-border border-t pt-3">
								<Input
									onBlur={flushCategoryName}
									onChange={event => setLocalCategoryName(event.currentTarget.value)}
									placeholder={t("admin.categories.create.namePlaceholder")}
									value={localCategoryName}
								/>
								<Button
									disabled={!localCategoryName.trim() || createCategory.isPending}
									onClick={addCategory}
									type="button"
									variant="outline"
								>
									{t("admin.products.taxonomy.create")}
								</Button>
							</div>
						</section>
						<section className="space-y-3 rounded-lg border border-border p-4">
							<div>
								<h3 className="font-semibold">{t("admin.products.taxonomy.tags")}</h3>
								<p className="text-muted-foreground text-sm">{t("admin.products.taxonomy.tagsHint")}</p>
							</div>
							<ScrollArea className="max-h-52 space-y-2 overflow-y-auto">
								{tagsQuery.data?.map(tag => (
									<div
										className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent p-2 hover:border-border hover:bg-muted/40"
										key={tag.id}
									>
										<Checkbox
											checked={tagIds.includes(tag.id)}
											id={`tag-${tag.id}`}
											onChange={() => setTagIds(ids => toggleId(ids, tag.id))}
										/>
										<span
											aria-hidden
											className="size-3 rounded-full"
											style={{ backgroundColor: tag.color }}
										/>
										<label className="flex-1 cursor-pointer text-sm" htmlFor={`tag-${tag.id}`}>
											{tag.name}
										</label>
										<Badge tone="neutral">{tag.products.length}</Badge>
									</div>
								))}
							</ScrollArea>
							<div className="space-y-2 border-border border-t pt-3">
								<div className="flex gap-2">
									<Input
										onBlur={flushTagName}
										onChange={event => setLocalTagName(event.currentTarget.value)}
										placeholder={t("admin.tags.create.namePlaceholder")}
										value={localTagName}
									/>
									<Button
										disabled={!localTagName.trim() || createTag.isPending}
										onClick={addTag}
										type="button"
										variant="outline"
									>
										{t("admin.products.taxonomy.create")}
									</Button>
								</div>
								<ColorField onChange={setTagColor} value={tagColor} />
							</div>
						</section>
					</div>
				)}
				{(categoriesQuery.isError || tagsQuery.isError || error) && (
					<p className="text-destructive text-sm">{error ?? t("admin.products.taxonomy.loadError")}</p>
				)}
				<div className="flex justify-end gap-2">
					<Button disabled={update.isPending} onClick={onClose} type="button" variant="outline">
						{t("admin.products.taxonomy.cancel")}
					</Button>
					<Button disabled={pending || update.isPending} onClick={save} type="button">
						{update.isPending ? t("admin.products.taxonomy.saving") : t("admin.products.taxonomy.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
