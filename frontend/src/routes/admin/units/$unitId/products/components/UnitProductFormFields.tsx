import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { NumericInput } from "@/components/ui/NumericInput";
import type { Category, Product, Tag } from "./types";

interface UnitProductFormFieldsProps {
	available: boolean;
	categories: Category[];
	categoriesOverridden: boolean;
	categoryIds: string[];
	onAvailableChange: (value: boolean) => void;
	onCategoriesOverriddenChange: (value: boolean) => void;
	onCategoryIdsChange: (value: string[]) => void;
	onPriceEnabledChange: (value: boolean) => void;
	onPriceReaisChange: (value: number) => void;
	onStockChange: (value: number) => void;
	onStockEnabledChange: (value: boolean) => void;
	onTagIdsChange: (value: string[]) => void;
	onTagsOverriddenChange: (value: boolean) => void;
	priceEnabled: boolean;
	priceReais: number;
	product?: { onChange: (value: string) => void; options: { label: string; value: string }[]; value: string };
	selectedProduct?: Product;
	stock: number;
	stockEnabled: boolean;
	tagIds: string[];
	tags: Tag[];
	tagsOverridden: boolean;
}

function toggle(ids: string[], id: string) {
	return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
}

export function UnitProductFormFields(props: UnitProductFormFieldsProps) {
	const { t } = useTranslation();
	const fieldId = useId();
	const {
		available,
		categories,
		categoriesOverridden,
		categoryIds,
		onAvailableChange,
		onCategoriesOverriddenChange,
		onCategoryIdsChange,
		onPriceEnabledChange,
		onPriceReaisChange,
		onStockChange,
		onStockEnabledChange,
		onTagIdsChange,
		onTagsOverriddenChange,
		priceEnabled,
		priceReais,
		product,
		selectedProduct,
		stock,
		stockEnabled,
		tagIds,
		tags,
		tagsOverridden,
	} = props;

	return (
		<>
			{product && (
				<div>
					<span className="font-medium text-sm">{t("admin.unitProducts.form.product")}</span>
					<CustomSelect onChange={product.onChange} options={product.options} value={product.value} />
				</div>
			)}
			<div className="space-y-2">
				<label
					className="flex cursor-pointer items-center gap-2 font-medium text-sm"
					htmlFor={`${fieldId}-categories-override`}
				>
					<Checkbox
						checked={categoriesOverridden}
						id={`${fieldId}-categories-override`}
						onChange={event => onCategoriesOverriddenChange(event.currentTarget.checked)}
					/>
					{t("admin.unitProducts.form.categoriesOverride")}
				</label>
				{categoriesOverridden ? (
					<div className="max-h-32 space-y-1 overflow-auto rounded-md border border-border p-2">
						{categories.map(category => (
							<label
								className="flex cursor-pointer items-center gap-2 text-sm"
								htmlFor={`${fieldId}-category-${category.id}`}
								key={category.id}
							>
								<Checkbox
									checked={categoryIds.includes(category.id)}
									id={`${fieldId}-category-${category.id}`}
									onChange={() => onCategoryIdsChange(toggle(categoryIds, category.id))}
								/>
								{category.name}
							</label>
						))}
					</div>
				) : (
					<div className="flex flex-wrap gap-1">
						{selectedProduct?.categories.map(category => (
							<Badge key={category.id} tone="neutral">
								{category.name}
							</Badge>
						))}
						<span className="text-muted-foreground text-xs">{t("admin.unitProducts.form.inherited")}</span>
					</div>
				)}
			</div>
			<div className="space-y-2">
				<label
					className="flex cursor-pointer items-center gap-2 font-medium text-sm"
					htmlFor={`${fieldId}-tags-override`}
				>
					<Checkbox
						checked={tagsOverridden}
						id={`${fieldId}-tags-override`}
						onChange={event => onTagsOverriddenChange(event.currentTarget.checked)}
					/>
					{t("admin.unitProducts.form.tagsOverride")}
				</label>
				{tagsOverridden ? (
					<div className="max-h-32 space-y-1 overflow-auto rounded-md border border-border p-2">
						{tags.map(tag => (
							<label
								className="flex cursor-pointer items-center gap-2 text-sm"
								htmlFor={`${fieldId}-tag-${tag.id}`}
								key={tag.id}
							>
								<Checkbox
									checked={tagIds.includes(tag.id)}
									id={`${fieldId}-tag-${tag.id}`}
									onChange={() => onTagIdsChange(toggle(tagIds, tag.id))}
								/>
								<span aria-hidden className="size-3 rounded-full" style={{ backgroundColor: tag.color }} />
								{tag.name}
							</label>
						))}
					</div>
				) : (
					<div className="flex flex-wrap gap-1">
						{selectedProduct?.tags.map(tag => (
							<Badge key={tag.id} style={{ borderColor: tag.color, color: tag.color }}>
								{tag.name}
							</Badge>
						))}
						<span className="text-muted-foreground text-xs">{t("admin.unitProducts.form.inherited")}</span>
					</div>
				)}
			</div>
			<div className="space-y-2">
				<label
					className="flex cursor-pointer items-center gap-2 font-medium text-sm"
					htmlFor={`${fieldId}-price-override`}
				>
					<Checkbox
						checked={priceEnabled}
						id={`${fieldId}-price-override`}
						onChange={event => onPriceEnabledChange(event.currentTarget.checked)}
					/>
					{t("admin.unitProducts.form.priceOverride")}
				</label>
				<CurrencyInput
					disabled={!priceEnabled}
					onValueChange={({ floatValue }) => onPriceReaisChange(floatValue ?? 0)}
					placeholder="R$ 18,90"
					value={priceReais}
				/>
			</div>
			<div className="flex flex-col space-y-2">
				<label
					className="flex cursor-pointer items-center gap-2 font-medium text-sm"
					htmlFor={`${fieldId}-stock-enabled`}
				>
					<Checkbox
						checked={stockEnabled}
						id={`${fieldId}-stock-enabled`}
						onChange={event => onStockEnabledChange(event.currentTarget.checked)}
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
						<button
							aria-checked={available}
							aria-label={t("admin.unitProducts.form.available")}
							className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${available ? "bg-primary" : "bg-muted"}`}
							onClick={() => onAvailableChange(!available)}
							role="switch"
							type="button"
						>
							<span
								className={`absolute top-1 size-4 rounded-full bg-background transition-transform ${available ? "translate-x-6" : "translate-x-1"}`}
							/>
						</button>
					</div>
				)}
			</div>
		</>
	);
}
