import { useTranslation } from "react-i18next";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { RequiredMark } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/NumericInput";
import type { GetUnits200 } from "@/lib/api";
import type { CouponFormState } from "./types";

interface CouponFormFieldsProps {
	code: string;
	showBasics?: boolean;
	onChange: (next: Partial<CouponFormState>) => void;
	onCodeBlur: () => void;
	onCodeChange: (value: string) => void;
	units: GetUnits200 | undefined;
	value: CouponFormState;
}

export function CouponFormFields({
	code,
	showBasics = true,
	onChange,
	onCodeBlur,
	onCodeChange,
	units,
	value,
}: CouponFormFieldsProps) {
	const { t } = useTranslation();
	const discountValue = value.type === "fixed" ? value.value / 100 : value.value;

	return (
		<>
			{showBasics && <div className="grid gap-4 md:grid-cols-2">
				<label className="grid gap-2 font-medium text-sm">
					<span>
						{t("admin.coupons.form.code")} <RequiredMark />
					</span>
					<Input
						onBlur={onCodeBlur}
						onChange={event => onCodeChange(event.currentTarget.value.toUpperCase())}
						placeholder={t("admin.coupons.form.codePlaceholder")}
						required
						value={code}
					/>
				</label>

				<div className="grid gap-2 font-medium text-sm">
					<span>
						{t("admin.coupons.form.type")} <RequiredMark />
					</span>
					<CustomSelect
						onChange={type => onChange({ type: type as CouponFormState["type"], value: 0 })}
						options={[
							{ label: t("admin.coupons.types.percent"), value: "percent" },
							{ label: t("admin.coupons.types.fixed"), value: "fixed" },
						]}
						value={value.type}
					/>
				</div>
			</div>}

			<div className="grid gap-4 md:grid-cols-2">
				<div className="grid gap-2 font-medium text-sm">
					<span>
						{t("admin.coupons.form.value")} <RequiredMark />
					</span>
					<NumericInput
						decimalScale={value.type === "fixed" ? 2 : 0}
						onValueChange={({ floatValue }) =>
							onChange({ value: Math.round((floatValue ?? 0) * (value.type === "fixed" ? 100 : 1)) })
						}
						placeholder={value.type === "fixed" ? "R$ 10,00" : "10%"}
						prefix={value.type === "fixed" ? "R$ " : ""}
						suffix={value.type === "percent" ? "%" : ""}
						value={discountValue}
					/>
				</div>

				<div className="grid gap-2 font-medium text-sm">
					<span>{t("admin.coupons.form.unit")}</span>
					<CustomSelect
						onChange={unitId => onChange({ unitId: unitId || null })}
						options={[
							{ label: t("admin.coupons.form.allUnits"), value: "" },
							...(units ?? []).map(unit => ({ label: unit.name, value: unit.id })),
						]}
						value={value.unitId ?? ""}
					/>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<div className="grid gap-2 font-medium text-sm">
					<span>{t("admin.coupons.form.minOrder")}</span>
					<NumericInput
						onValueChange={({ floatValue }) => onChange({ minOrderCents: Math.round((floatValue ?? 0) * 100) })}
						placeholder="R$ 50,00"
						prefix="R$ "
						value={value.minOrderCents / 100}
					/>
				</div>

				<div className="grid gap-2 font-medium text-sm">
					<span>{t("admin.coupons.form.maxUses")}</span>
					<NumericInput
						decimalScale={0}
						onValueChange={({ floatValue }) => onChange({ maxUses: floatValue ? Math.round(floatValue) : null })}
						placeholder={t("admin.coupons.form.maxUsesPlaceholder")}
						value={value.maxUses ?? 0}
					/>
				</div>

				<div className="grid gap-2 font-medium text-sm">
					<span>{t("admin.coupons.form.expiresAt")}</span>
					<MaskedInput
						format="####-##-## ##:##"
						mask="_"
						onValueChange={({ value: expiresAt }) => onChange({ expiresAt })}
						placeholder="2026-12-31 23:59"
						value={value.expiresAt}
					/>
				</div>
			</div>
		</>
	);
}
