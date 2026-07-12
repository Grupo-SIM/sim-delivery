import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { NumericInput } from "@/components/ui/NumericInput";
import { getUnitsByUnitIdProductsQueryKey, usePatchUnitsByUnitIdProductsByUnitProductId } from "@/lib/api";
import type { Category, UnitProduct } from "./types";

interface UnitProductEditRowProps {
	association: UnitProduct;
	categories: Category[];
	onCancel: () => void;
	unitId: string;
}

export function UnitProductEditRow({ association, categories, onCancel, unitId }: UnitProductEditRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [categoryId, setCategoryId] = useState(association.categoryId ?? "");
	const [available, setAvailable] = useState(association.available);
	const [priceEnabled, setPriceEnabled] = useState(association.priceCentsOverride !== null);
	const [priceReais, setPriceReais] = useState(Number(association.priceCentsOverride ?? 0) / 100);
	const [stockEnabled, setStockEnabled] = useState(association.stock !== null);
	const [stock, setStock] = useState(Number(association.stock ?? 0));
	const [error, setError] = useState<string | null>(null);

	const { isPending, mutate } = usePatchUnitsByUnitIdProductsByUnitProductId();

	const categoryOptions = [
		{ label: t("admin.unitProducts.form.loose"), value: "" },
		...categories.map(c => ({ label: c.name, value: c.id })),
	];

	function save() {
		setError(null);
		mutate(
			{
				data: {
					available,
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
					onCancel();
				},
			},
		);
	}

	return (
		<tr className="border-border/60 border-b last:border-0">
			<td className="px-4 py-3" colSpan={5}>
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<span className="font-medium text-sm">{t("admin.unitProducts.form.category")}</span>
						<CustomSelect onChange={setCategoryId} options={categoryOptions} value={categoryId} />
					</div>
					<label className="flex items-center gap-2 font-medium text-sm">
						<input
							checked={available}
							onChange={event => setAvailable(event.currentTarget.checked)}
							type="checkbox"
						/>
						{t("admin.unitProducts.form.available")}
					</label>
					<div className="space-y-2">
						<label className="flex items-center gap-2 font-medium text-sm">
							<input
								checked={priceEnabled}
								onChange={event => setPriceEnabled(event.currentTarget.checked)}
								type="checkbox"
							/>
							{t("admin.unitProducts.form.priceOverride")}
						</label>
						<NumericInput
							decimalScale={2}
							decimalSeparator=","
							disabled={!priceEnabled}
							onValueChange={({ floatValue }) => setPriceReais(floatValue ?? 0)}
							placeholder="R$ 18,90"
							prefix="R$ "
							thousandSeparator="."
							value={priceReais}
						/>
					</div>
					<div className="space-y-2">
						<label className="flex items-center gap-2 font-medium text-sm">
							<input
								checked={stockEnabled}
								onChange={event => setStockEnabled(event.currentTarget.checked)}
								type="checkbox"
							/>
							{t("admin.unitProducts.form.stock")}
						</label>
						<NumericInput
							decimalScale={0}
							disabled={!stockEnabled}
							onValueChange={({ floatValue }) => setStock(floatValue ?? 0)}
							placeholder="10"
							value={stock}
						/>
					</div>
				</div>
				{error && <p className="mt-2 text-destructive text-xs">{error}</p>}
				<div className="mt-4 flex justify-end gap-2">
					<Button disabled={isPending} onClick={onCancel} type="button" variant="outline">
						{t("admin.unitProducts.edit.cancel")}
					</Button>
					<Button disabled={isPending} onClick={save} type="button">
						{isPending ? t("admin.unitProducts.edit.saving") : t("admin.unitProducts.edit.save")}
					</Button>
				</div>
			</td>
		</tr>
	);
}
