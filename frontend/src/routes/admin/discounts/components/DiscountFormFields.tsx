import { useTranslation } from "react-i18next";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/NumericInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { GetProducts200, GetTags200, GetUnits200 } from "@/lib/api";
import { TargetPicker } from "./TargetPicker";
import type { DiscountFormState } from "./types";

interface DiscountFormFieldsProps {
	onChange: (next: Partial<DiscountFormState>) => void;
	products: GetProducts200 | undefined;
	tags: GetTags200 | undefined;
	units: GetUnits200 | undefined;
	value: DiscountFormState;
}

export function DiscountFormFields({ onChange, products, tags, units, value }: DiscountFormFieldsProps) {
	const { t } = useTranslation();
	const [localName, setLocalName, flushName] = useDebouncedInput(value.name, name => onChange({ name }));
	const isFixed = value.type === "fixed";

	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-2">
				{/* biome-ignore lint/a11y/noLabelWithoutControl: Input is a custom control nested in the label. */}
				<label className="grid gap-2 font-medium text-sm">
					<span>
						{t("admin.discounts.form.name")} <RequiredMark />
					</span>
					<Input
						name="discount-name"
						onBlur={flushName}
						onChange={event => setLocalName(event.currentTarget.value)}
						placeholder={t("admin.discounts.form.namePlaceholder")}
						required
						value={localName}
					/>
				</label>
				<div className="grid gap-2 font-medium text-sm">
					<span>
						{t("admin.discounts.form.kind")} <RequiredMark />
					</span>
					<CustomSelect
						onChange={kind => onChange({ kind: kind as DiscountFormState["kind"] })}
						options={[
							{ label: t("admin.discounts.kinds.real"), value: "real" },
							{ label: t("admin.discounts.kinds.fake"), value: "fake" },
						]}
						value={value.kind}
					/>
					<p className="font-normal text-muted-foreground text-xs">
						{t(`admin.discounts.kindHints.${value.kind}`)}
					</p>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="grid gap-2 font-medium text-sm">
					<span>
						{t("admin.discounts.form.type")} <RequiredMark />
					</span>
					<CustomSelect
						onChange={type => onChange({ type: type as DiscountFormState["type"], value: 0 })}
						options={[
							{ label: t("admin.discounts.types.percent"), value: "percent" },
							{ label: t("admin.discounts.types.fixed"), value: "fixed" },
						]}
						value={value.type}
					/>
				</div>
				<div className="grid gap-2 font-medium text-sm">
					<span>
						{t("admin.discounts.form.value")} <RequiredMark />
					</span>
					<NumericInput
						decimalScale={isFixed ? 2 : 0}
						onValueChange={({ floatValue }) =>
							onChange({ value: Math.round((floatValue ?? 0) * (isFixed ? 100 : 1)) })
						}
						placeholder={isFixed ? "R$ 5,00" : "20%"}
						prefix={isFixed ? "R$ " : ""}
						suffix={isFixed ? "" : "%"}
						value={isFixed ? value.value / 100 : value.value}
					/>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<TargetPicker
					emptyLabel={t("admin.discounts.form.allProducts")}
					label={t("admin.discounts.form.products")}
					onChange={productIds => onChange({ productIds })}
					options={(products ?? []).map(product => ({ id: product.id, label: product.title }))}
					selected={value.productIds}
				/>
				<TargetPicker
					emptyLabel={t("admin.discounts.form.noTags")}
					label={t("admin.discounts.form.tags")}
					onChange={tagIds => onChange({ tagIds })}
					options={(tags ?? []).map(tag => ({ id: tag.id, label: tag.name }))}
					selected={value.tagIds}
				/>
				<TargetPicker
					emptyLabel={t("admin.discounts.form.allUnits")}
					label={t("admin.discounts.form.units")}
					onChange={unitIds => onChange({ unitIds })}
					options={(units ?? []).map(unit => ({ id: unit.id, label: unit.name }))}
					selected={value.unitIds}
				/>
			</div>
			<p className="text-muted-foreground text-xs">{t("admin.discounts.form.targetsHint")}</p>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="grid gap-2 font-medium text-sm">
					<span>{t("admin.discounts.form.startsAt")}</span>
					<DateTimePicker onChange={startsAt => onChange({ startsAt })} value={value.startsAt} />
				</div>
				<div className="grid gap-2 font-medium text-sm">
					<span>{t("admin.discounts.form.endsAt")}</span>
					<DateTimePicker onChange={endsAt => onChange({ endsAt })} value={value.endsAt} />
				</div>
			</div>
		</div>
	);
}
