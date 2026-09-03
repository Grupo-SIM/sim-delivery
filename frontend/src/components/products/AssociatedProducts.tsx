import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	getCategoriesQueryKey,
	getProductsQueryKey,
	getTagsQueryKey,
	useGetProducts,
	usePatchProductsByProductId,
} from "@/lib/api";
import { showToast } from "@/stores";

interface AssociatedProduct {
	id: string;
	title: string;
}

interface AssociatedProductsProps {
	canManage: boolean;
	association: "category" | "tag";
	modalTitle: string;
	products: AssociatedProduct[];
	urlKey: string;
	urlState: string;
	viewLabel: string;
}

export function AssociatedProducts({
	association,
	canManage,
	modalTitle,
	products,
	urlKey,
	urlState,
	viewLabel,
}: AssociatedProductsProps) {
	const { t } = useTranslation();
	const translationKey =
		association === "category"
			? "admin.categories.productAssociations"
			: "admin.tags.productAssociations";
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const productsQuery = useGetProducts({ query: { enabled: isOpen } });
	const updateProduct = usePatchProductsByProductId();
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [search, setSearch] = useState("");
	const [localSearch, setLocalSearch] = useDebouncedInput(search, setSearch);
	const [saving, setSaving] = useState(false);
	const associatedIds = useMemo(() => new Set(products.map(product => product.id)), [products]);
	const filteredProducts = useMemo(() => {
		const normalizedSearch = search.trim().toLocaleLowerCase();
		if (!normalizedSearch) return productsQuery.data ?? [];
		return (productsQuery.data ?? []).filter(product =>
			product.title.toLocaleLowerCase().includes(normalizedSearch),
		);
	}, [productsQuery.data, search]);

	useEffect(() => {
		if (!isOpen) return;
		setSelectedIds([...associatedIds]);
		setSearch("");
	}, [associatedIds, isOpen]);

	function toggleProduct(productId: string) {
		setSelectedIds(ids =>
			ids.includes(productId) ? ids.filter(id => id !== productId) : [...ids, productId],
		);
	}

	async function save() {
		if (!productsQuery.data) return;
		const selected = new Set(selectedIds);
		const changedProducts = productsQuery.data.filter(
			product => selected.has(product.id) !== associatedIds.has(product.id),
		);
		if (changedProducts.length === 0) {
			setIsOpen(false);
			return;
		}

		setSaving(true);
		try {
			await Promise.all(
				changedProducts.map(product =>
					updateProduct.mutateAsync({
						data:
							association === "category"
								? {
										categoryIds: selected.has(product.id)
											? [...product.categories.map(category => category.id), urlState]
											: product.categories.map(category => category.id).filter(id => id !== urlState),
									}
								: {
										tagIds: selected.has(product.id)
											? [...product.tags.map(tag => tag.id), urlState]
											: product.tags.map(tag => tag.id).filter(id => id !== urlState),
									},
						productId: product.id,
					}),
				),
			);
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: getCategoriesQueryKey() }),
				queryClient.invalidateQueries({ queryKey: getProductsQueryKey() }),
				queryClient.invalidateQueries({ queryKey: getTagsQueryKey() }),
			]);
			showToast(t(`${translationKey}.saveSuccess`), "positive");
			setIsOpen(false);
		} catch {
			showToast(t(`${translationKey}.saveError`), "negative");
		} finally {
			setSaving(false);
		}
	}

	return (
		<>
			<Button
				className="cursor-pointer"
				onClick={() => setIsOpen(true)}
				size="sm"
				type="button"
				variant="outline"
			>
				{viewLabel}
			</Button>
			<Modal
				isOpen={isOpen}
				maxWidth="640px"
				onClose={() => setIsOpen(false)}
				title={modalTitle}
				urlKey={urlKey}
				urlState={urlState}
			>
				<div className="space-y-4">
					<div className="flex items-center justify-between gap-3">
						<Badge tone="neutral">{t(`${translationKey}.selected`, { count: selectedIds.length })}</Badge>
						{!canManage && (
							<span className="text-muted-foreground text-sm">{t(`${translationKey}.readOnly`)}</span>
						)}
					</div>
					<Input
						name="product-search"
						onChange={event => setLocalSearch(event.currentTarget.value)}
						placeholder={t(`${translationKey}.searchPlaceholder`)}
						value={localSearch}
					/>
					{productsQuery.isPending ? (
						<div className="space-y-2">
							<Skeleton className="h-14" />
							<Skeleton className="h-14" />
							<Skeleton className="h-14" />
						</div>
					) : (
						<ScrollArea className="max-h-80 overflow-y-auto pr-3">
							<div className="space-y-2">
								{filteredProducts.map(product => (
									<label
										className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
										key={product.id}
									>
										<Checkbox
											checked={selectedIds.includes(product.id)}
											disabled={!canManage || saving}
											id={`associated-product-${urlState}-${product.id}`}
											onChange={() => toggleProduct(product.id)}
										/>
										<span className="min-w-0 flex-1 truncate font-medium">{product.title}</span>
									</label>
								))}
								{filteredProducts.length === 0 && (
									<p className="py-6 text-center text-muted-foreground text-sm">
										{t(`${translationKey}.empty`)}
									</p>
								)}
							</div>
						</ScrollArea>
					)}
					{canManage && (
						<div className="flex justify-end gap-2 border-border border-t pt-4">
							<Button disabled={saving} onClick={() => setIsOpen(false)} type="button" variant="outline">
								{t(`${translationKey}.cancel`)}
							</Button>
							<Button disabled={productsQuery.isPending || saving} onClick={save} type="button">
								{saving ? t(`${translationKey}.saving`) : t(`${translationKey}.save`)}
							</Button>
						</div>
					)}
				</div>
			</Modal>
		</>
	);
}
