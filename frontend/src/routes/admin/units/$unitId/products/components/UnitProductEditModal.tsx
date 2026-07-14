import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { getUnitsByUnitIdProductsQueryKey, usePatchUnitsByUnitIdProductsByUnitProductId } from "@/lib/api";
import { UnitProductFormFields } from "./UnitProductFormFields";
import type { Category, UnitProduct } from "./types";

interface UnitProductEditModalProps {
	association: UnitProduct | null;
	categories: Category[];
	onClose: () => void;
	unitId: string;
}

export function UnitProductEditModal({ association, categories, onClose, unitId }: UnitProductEditModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [categoryId, setCategoryId] = useState("");
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
		setCategoryId(association.categoryId ?? "");
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
					categoryId: categoryId || null,
					priceCentsOverride: priceEnabled ? Math.round(priceReais * 100) : null,
					stock: stockEnabled ? Math.round(stock) : null,
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
							categoryId={categoryId}
							categories={categories}
							onAvailableChange={setAvailable}
							onCategoryIdChange={setCategoryId}
							onPriceEnabledChange={setPriceEnabled}
							onPriceReaisChange={setPriceReais}
							onStockChange={setStock}
							onStockEnabledChange={setStockEnabled}
							priceEnabled={priceEnabled}
							priceReais={priceReais}
							stock={stock}
							stockEnabled={stockEnabled}
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
