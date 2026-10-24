import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CollapsibleFormSection } from "@/components/ui/CollapsibleFormSection";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { RequiredMark } from "@/components/ui/label";
import { getUnitsByUnitIdProductsQueryKey, usePostUnitsByUnitIdProducts } from "@/lib/api";
import type { Category, Product, Tag, UnitProduct } from "./types";
import { UnitProductFormFields } from "./UnitProductFormFields";

interface AssociateProductFormProps {
	associations: UnitProduct[];
	categories: Category[];
	products: Product[];
	tags: Tag[];
	unitId: string;
}

export function AssociateProductForm({
	associations,
	categories,
	products,
	tags,
	unitId,
}: AssociateProductFormProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [productId, setProductId] = useState("");
	const [categoriesOverridden, setCategoriesOverridden] = useState(false);
	const [categoryIds, setCategoryIds] = useState<string[]>([]);
	const [tagsOverridden, setTagsOverridden] = useState(false);
	const [tagIds, setTagIds] = useState<string[]>([]);
	const [available, setAvailable] = useState(true);
	const [priceEnabled, setPriceEnabled] = useState(false);
	const [priceReais, setPriceReais] = useState(0);
	const [stockEnabled, setStockEnabled] = useState(false);
	const [stock, setStock] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const hasData = useMemo(
		() => !!productId || categoriesOverridden || categoryIds.length > 0 || tagsOverridden || tagIds.length > 0 || !available || priceEnabled || priceReais !== 0 || stockEnabled || stock !== 0,
		[productId, categoriesOverridden, categoryIds, tagsOverridden, tagIds, available, priceEnabled, priceReais, stockEnabled, stock],
	);

	const { isPending, mutate } = usePostUnitsByUnitIdProducts();

	const associatedIds = new Set(associations.map(a => a.productId));
	const availableProducts = products
		.filter(product => !associatedIds.has(product.id))
		.toSorted((first, second) => first.title.localeCompare(second.title, "pt-BR"));

	const productOptions = [
		{ label: t("admin.unitProducts.form.productPlaceholder"), value: "" },
		...availableProducts.map(product => ({
			imageUrl: product.imageUrl,
			label: product.title,
			value: product.id,
		})),
	];
	function reset() {
		setProductId("");
		setCategoriesOverridden(false);
		setCategoryIds([]);
		setTagsOverridden(false);
		setTagIds([]);
		setAvailable(true);
		setPriceEnabled(false);
		setPriceReais(0);
		setStockEnabled(false);
		setStock(0);
	}

	return (
		<form
			className="group space-y-4 rounded-lg border border-border bg-card text-card-foreground p-4"
			onSubmit={event => {
				event.preventDefault();
				setError(null);
				mutate(
					{
						data: {
							available: stockEnabled ? stock > 0 : available,
							categoryIds: categoriesOverridden ? categoryIds : null,
							priceCentsOverride: priceEnabled ? Math.round(priceReais * 100) : null,
							productId,
							stock: stockEnabled ? Math.round(stock) : null,
							tagIds: tagsOverridden ? tagIds : null,
						},
						unitId,
					},
					{
						onError: () => setError(t("admin.unitProducts.form.error")),
						onSuccess: async () => {
							reset();
							await queryClient.invalidateQueries({
								queryKey: getUnitsByUnitIdProductsQueryKey(unitId),
							});
						},
					},
				);
			}}
		>
			<div className="space-y-2">
				<span className="font-medium text-sm">{t("admin.unitProducts.form.product")} <RequiredMark /></span>
				<CustomSelect onChange={setProductId} options={productOptions} value={productId} />
			</div>
			<CollapsibleFormSection expanded={hasData}>
				<div className="grid gap-4 md:grid-cols-2">
			<UnitProductFormFields
				available={available}
				categories={categories}
				categoriesOverridden={categoriesOverridden}
				categoryIds={categoryIds}
				onAvailableChange={setAvailable}
				onCategoriesOverriddenChange={setCategoriesOverridden}
				onCategoryIdsChange={setCategoryIds}
				onPriceEnabledChange={setPriceEnabled}
				onPriceReaisChange={setPriceReais}
				onStockChange={setStock}
				onStockEnabledChange={setStockEnabled}
				onTagIdsChange={setTagIds}
				onTagsOverriddenChange={setTagsOverridden}
				priceEnabled={priceEnabled}
				priceReais={priceReais}
				selectedProduct={products.find(product => product.id === productId)}
				stock={stock}
				stockEnabled={stockEnabled}
				tagIds={tagIds}
				tags={tags}
				tagsOverridden={tagsOverridden}
			/>
				</div>
			</CollapsibleFormSection>

			<div className="flex items-center gap-3">
				<Button disabled={isPending || !productId} type="submit">
					{isPending ? t("admin.unitProducts.form.submitting") : t("admin.unitProducts.form.submit")}
				</Button>
				{error && <p className="text-destructive text-xs">{error}</p>}
			</div>
		</form>
	);
}
