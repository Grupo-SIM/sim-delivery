import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Modal } from "@/components/ui/Modal";
import {
	getUnitsByUnitIdProductsQueryKey,
	useGetProductsByProductIdOptionGroups,
	usePatchUnitsByUnitIdProductsByUnitProductId,
} from "@/lib/api";
import type { Category, Product, Tag, UnitProduct } from "./types";
import {
	type UnitAdditionalOption,
	type UnitOptionOverride,
	UnitOptionOverridesFields,
} from "./UnitOptionOverridesFields";
import { UnitProductFormFields } from "./UnitProductFormFields";

interface UnitProductEditModalProps {
	association: UnitProduct | null;
	categories: Category[];
	product?: Product;
	tags: Tag[];
	onClose: () => void;
	unitId: string;
}

export function UnitProductEditModal({
	association,
	categories,
	onClose,
	product,
	tags,
	unitId,
}: UnitProductEditModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [categoriesOverridden, setCategoriesOverridden] = useState(false);
	const [categoryIds, setCategoryIds] = useState<string[]>([]);
	const [tagsOverridden, setTagsOverridden] = useState(false);
	const [tagIds, setTagIds] = useState<string[]>([]);
	const [available, setAvailable] = useState(true);
	const [priceEnabled, setPriceEnabled] = useState(false);
	const [priceReais, setPriceReais] = useState(0);
	const [promotionalPriceReais, setPromotionalPriceReais] = useState<number | null>(null);
	const [stockEnabled, setStockEnabled] = useState(false);
	const [stock, setStock] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [optionOverrides, setOptionOverrides] = useState<UnitOptionOverride[]>([]);
	const [additionalOptions, setAdditionalOptions] = useState<UnitAdditionalOption[]>([]);

	const { isPending, mutate } = usePatchUnitsByUnitIdProductsByUnitProductId();
	const optionGroups = useGetProductsByProductIdOptionGroups(product?.id);

	useEffect(() => {
		if (!association) {
			return;
		}
		setCategoriesOverridden(association.categoriesOverridden);
		setCategoryIds(association.categoryIds);
		setTagsOverridden(association.tagsOverridden);
		setTagIds(association.tagIds);
		setAvailable(association.available);
		setPriceEnabled(association.priceCentsOverride !== null);
		setPriceReais(Number(association.priceCentsOverride ?? 0) / 100);
		setPromotionalPriceReais(
			association.promotionalPriceCents === null ? null : Number(association.promotionalPriceCents) / 100,
		);
		setStockEnabled(association.stock !== null);
		setStock(Number(association.stock ?? 0));
		setOptionOverrides(
			association.optionOverrides.map(override => ({
				available: override.available,
				description: override.description,
				imageUrl: override.imageUrl,
				maxPerItem: override.maxPerItem === null ? null : Number(override.maxPerItem),
				name: override.name,
				optionId: override.optionId,
				priceDeltaCents: override.priceDeltaCents === null ? null : Number(override.priceDeltaCents),
				sortOrder: override.sortOrder === null ? null : Number(override.sortOrder),
			})),
		);
		setAdditionalOptions(
			association.additionalOptions.map(option => ({
				...option,
				maxPerItem: option.maxPerItem === null ? null : Number(option.maxPerItem),
				priceDeltaCents: Number(option.priceDeltaCents),
				sortOrder: Number(option.sortOrder),
			})),
		);
		setError(null);
	}, [association]);

	function save() {
		if (!association) {
			return;
		}
		setError(null);
		mutate(
			{
				data: {
					additionalOptions,
					available: stockEnabled ? stock > 0 : available,
					categoryIds: categoriesOverridden ? categoryIds : null,
					optionOverrides,
					priceCentsOverride: priceEnabled ? Math.round(priceReais * 100) : null,
					promotionalPriceCents:
						promotionalPriceReais === null ? null : Math.round(promotionalPriceReais * 100),
					stock: stockEnabled ? Math.round(stock) : null,
					tagIds: tagsOverridden ? tagIds : null,
				},
				unitId,
				unitProductId: association.id,
			},
			{
				onError: () => setError(t("admin.unitProducts.edit.error")),
				onSuccess: async () => {
					await queryClient.invalidateQueries({
						queryKey: getUnitsByUnitIdProductsQueryKey(unitId),
					});
					onClose();
				},
			},
		);
	}

	return (
		<Modal
			isOpen={association !== null}
			onClose={onClose}
			title={t("admin.unitProducts.edit.title")}
			urlKey="unit-product-edit"
			urlState={association?.id}
		>
			<div className="space-y-4">
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
						selectedProduct={product}
						stock={stock}
						stockEnabled={stockEnabled}
						tagIds={tagIds}
						tags={tags}
						tagsOverridden={tagsOverridden}
					/>
				</div>
				<div className="block space-y-1">
					<span className="font-medium text-sm">Preço promocional nesta unidade</span>
					<CurrencyInput
						onValueChange={({ floatValue }) => setPromotionalPriceReais(floatValue)}
						placeholder="R$ 19,90"
						value={promotionalPriceReais}
					/>
					<span className="text-muted-foreground text-xs">Deixe vazio para remover promoção.</span>
				</div>
				{optionGroups.data && optionGroups.data.length > 0 && (
					<UnitOptionOverridesFields
						additionalOptions={additionalOptions}
						groups={optionGroups.data}
						onAdditionalOptionsChange={setAdditionalOptions}
						onOptionOverridesChange={setOptionOverrides}
						optionOverrides={optionOverrides}
					/>
				)}

				{error && <p className="text-destructive text-xs">{error}</p>}
				<div className="flex justify-end gap-2">
					<Button disabled={isPending} onClick={onClose} type="button" variant="outline">
						{t("admin.unitProducts.edit.cancel")}
					</Button>
					<Button disabled={isPending} onClick={save} type="button">
						{isPending ? t("admin.unitProducts.edit.saving") : t("admin.unitProducts.edit.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
