import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { getUnitsByUnitIdProductsQueryKey, usePatchUnitsByUnitIdProductsByUnitProductId } from "@/lib/api";
import type { Category, Product, Tag, UnitProduct } from "./types";
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
	const [stockEnabled, setStockEnabled] = useState(false);
	const [stock, setStock] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const { isPending, mutate } = usePatchUnitsByUnitIdProductsByUnitProductId();

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
		setStockEnabled(association.stock !== null);
		setStock(Number(association.stock ?? 0));
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
					available: stockEnabled ? stock > 0 : available,
					categoryIds: categoriesOverridden ? categoryIds : null,
					priceCentsOverride: priceEnabled ? Math.round(priceReais * 100) : null,
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
		<Modal isOpen={association !== null} onClose={onClose} title={t("admin.unitProducts.edit.title")}>
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
