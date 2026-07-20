import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
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

	const { isPending, mutate } = usePostUnitsByUnitIdProducts();

	const associatedIds = new Set(associations.map(a => a.productId));
	const availableProducts = products.filter(p => !associatedIds.has(p.id));

	const productOptions = [
		{ label: t("admin.unitProducts.form.productPlaceholder"), value: "" },
		...availableProducts.map(p => ({ label: p.title, value: p.id })),
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
			className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-2"
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
				product={{ onChange: setProductId, options: productOptions, value: productId }}
				selectedProduct={products.find(product => product.id === productId)}
				stock={stock}
				stockEnabled={stockEnabled}
				tagIds={tagIds}
				tags={tags}
				tagsOverridden={tagsOverridden}
			/>

			<div className="flex items-center gap-3 md:col-span-2">
				<Button disabled={isPending || !productId} type="submit">
					{isPending ? t("admin.unitProducts.form.submitting") : t("admin.unitProducts.form.submit")}
				</Button>
				{error && <p className="text-destructive text-xs">{error}</p>}
			</div>
		</form>
	);
}
