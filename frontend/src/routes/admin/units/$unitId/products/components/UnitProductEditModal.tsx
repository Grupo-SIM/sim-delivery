import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "baseui/switch";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { NumericInput } from "@/components/ui/NumericInput";
import { getUnitsByUnitIdProductsQueryKey, usePatchUnitsByUnitIdProductsByUnitProductId } from "@/lib/api";
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

	const categoryOptions = [
		{ label: t("admin.unitProducts.form.loose"), value: "" },
		...categories.map(c => ({ label: c.name, value: c.id })),
	];

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
					<div>
						<span className="font-medium text-sm">{t("admin.unitProducts.form.category")}</span>
						<CustomSelect onChange={setCategoryId} options={categoryOptions} value={categoryId} />
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
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
							<div className="flex min-h-10 items-center justify-between">
							<span className="font-medium text-sm">{t("admin.unitProducts.form.available")}</span>
							<Switch checked={available} onChange={event => setAvailable(event.currentTarget.checked)} />
						</div>
					)}
					</div>
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
