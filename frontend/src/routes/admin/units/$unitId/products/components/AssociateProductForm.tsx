import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "baseui/switch";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { NumericInput } from "@/components/ui/NumericInput";
import { getUnitsByUnitIdProductsQueryKey, usePostUnitsByUnitIdProducts } from "@/lib/api";
import type { Category, Product, UnitProduct } from "./types";

interface AssociateProductFormProps {
	associations: UnitProduct[];
	categories: Category[];
	products: Product[];
	unitId: string;
}

export function AssociateProductForm({
	associations,
	categories,
	products,
	unitId,
}: AssociateProductFormProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [productId, setProductId] = useState("");
	const [categoryId, setCategoryId] = useState("");
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
	const categoryOptions = [
		{ label: t("admin.unitProducts.form.loose"), value: "" },
		...categories.map(c => ({ label: c.name, value: c.id })),
	];

	function reset() {
		setProductId("");
		setCategoryId("");
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
							categoryId: categoryId || null,
							priceCentsOverride: priceEnabled ? Math.round(priceReais * 100) : null,
							productId,
							stock: stockEnabled ? Math.round(stock) : null,
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
			<div>
				<span className="font-medium text-sm">{t("admin.unitProducts.form.product")}</span>
				<CustomSelect onChange={setProductId} options={productOptions} value={productId} />
			</div>

			<div>
				<span className="font-medium text-sm">{t("admin.unitProducts.form.category")}</span>
				<CustomSelect onChange={setCategoryId} options={categoryOptions} value={categoryId} />
			</div>

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
					{stockEnabled ? (
						<NumericInput
							decimalScale={0}
							onValueChange={({ floatValue }) => setStock(floatValue ?? 0)}
							placeholder="10"
							value={stock}
						/>
					) : (
						<div className="flex items-center justify-between">
							<span className="font-medium text-sm">{t("admin.unitProducts.form.available")}</span>
							<Switch checked={available} onChange={event => setAvailable(event.currentTarget.checked)} />
						</div>
					)}
				</div>

			<div className="flex items-center gap-3 md:col-span-2">
				<Button disabled={isPending || !productId} type="submit">
					{isPending ? t("admin.unitProducts.form.submitting") : t("admin.unitProducts.form.submit")}
				</Button>
				{error && <p className="text-destructive text-xs">{error}</p>}
			</div>
		</form>
	);
}
