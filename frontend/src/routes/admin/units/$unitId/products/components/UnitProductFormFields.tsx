
import { useTranslation } from "react-i18next";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { NumericInput } from "@/components/ui/NumericInput";
import type { Category } from "./types";

interface UnitProductFormFieldsProps {
	available: boolean;
	categoryId: string;
	categories: Category[];
	onAvailableChange: (available: boolean) => void;
	onCategoryIdChange: (categoryId: string) => void;
	onPriceEnabledChange: (priceEnabled: boolean) => void;
	onPriceReaisChange: (priceReais: number) => void;
	onStockEnabledChange: (stockEnabled: boolean) => void;
	onStockChange: (stock: number) => void;
	priceEnabled: boolean;
	priceReais: number;
	product?: {
		onChange: (productId: string) => void;
		options: { label: string; value: string }[];
		value: string;
	};
	stock: number;
	stockEnabled: boolean;
}

export function UnitProductFormFields({
	available,
	categoryId,
	categories,
	onAvailableChange,
	onCategoryIdChange,
	onPriceEnabledChange,
	onPriceReaisChange,
	onStockChange,
	onStockEnabledChange,
	priceEnabled,
	priceReais,
	product,
	stock,
	stockEnabled,
}: UnitProductFormFieldsProps) {
	const { t } = useTranslation();
	const categoryOptions = [
		{ label: t("admin.unitProducts.form.loose"), value: "" },
		...categories.map(category => ({ label: category.name, value: category.id })),
	];

	return (
		<>
			{product && (
				<div>
					<span className="font-medium text-sm">{t("admin.unitProducts.form.product")}</span>
					<CustomSelect onChange={product.onChange} options={product.options} value={product.value} />
				</div>
			)}

			<div>
				<span className="font-medium text-sm">{t("admin.unitProducts.form.category")}</span>
				<CustomSelect onChange={onCategoryIdChange} options={categoryOptions} value={categoryId} />
			</div>

			<div className="space-y-2">
				<label className="flex items-center gap-2 font-medium text-sm">
					<input
						checked={priceEnabled}
						onChange={event => onPriceEnabledChange(event.currentTarget.checked)}
						type="checkbox"
					/>
					{t("admin.unitProducts.form.priceOverride")}
				</label>
				<NumericInput
					decimalScale={2}
					decimalSeparator=","
					disabled={!priceEnabled}
					onValueChange={({ floatValue }) => onPriceReaisChange(floatValue ?? 0)}
					placeholder="R$ 18,90"
					prefix="R$ "
					thousandSeparator="."
					value={priceReais}
				/>
			</div>

			<div className="flex flex-col space-y-2">
				<label className="flex items-center gap-2 font-medium text-sm">
					<input
						checked={stockEnabled}
						onChange={event => onStockEnabledChange(event.currentTarget.checked)}
						type="checkbox"
					/>
					{t("admin.unitProducts.form.stock")}
				</label>
				{stockEnabled ? (
					<NumericInput
						decimalScale={0}
						onValueChange={({ floatValue }) => onStockChange(floatValue ?? 0)}
						placeholder="10"
						value={stock}
					/>
				) : (
					<div className="flex flex-1 items-center justify-between">
						<span className="font-medium text-sm">{t("admin.unitProducts.form.available")}</span>
						<button aria-pressed={available} className={`h-6 w-11 rounded-full p-0.5 transition ${available ? "bg-primary" : "bg-muted"}`} onClick={() => onAvailableChange(!available)} type="button"><span className={`block size-5 rounded-full bg-white transition-transform ${available ? "translate-x-5" : "translate-x-0"}`} /></button>
					</div>
				)}
			</div>
		</>
	);
}
