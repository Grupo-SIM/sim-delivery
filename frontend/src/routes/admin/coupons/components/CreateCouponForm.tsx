import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CollapsibleFormSection } from "@/components/ui/CollapsibleFormSection";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/ui/label";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { getCouponsQueryKey, useGetUnits, usePostCoupons } from "@/lib/api";
import { CouponFormFields } from "./CouponFormFields";
import { type CouponFormState, dateTimeToDate, emptyCouponForm } from "./types";

export function CreateCouponForm() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [form, setForm] = useState<CouponFormState>(emptyCouponForm);
	const [localCode, setLocalCode, flushCode] = useDebouncedInput(form.code, code =>
		setForm(prev => ({ ...prev, code })),
	);
	const { data: units, isPending: unitsPending } = useGetUnits();
	const [error, setError] = useState<string | null>(null);
	const { isPending, mutate } = usePostCoupons();
	const hasData = useMemo(
		() =>
			form.value > 0 ||
			form.unitId !== null ||
			form.minOrderCents > 0 ||
			form.maxUses !== null ||
			form.expiresAt !== "",
		[form],
	);

	function update(next: Partial<CouponFormState>) {
		setForm(prev => ({ ...prev, ...next }));
	}

	function submit() {
		flushCode();
		setError(null);

		try {
			const expiresAt = dateTimeToDate(form.expiresAt);
			mutate(
				{
					data: {
						code: localCode.trim(),
						expiresAt,
						maxUses: form.maxUses,
						minOrderCents: form.minOrderCents,
						type: form.type,
						unitId: form.unitId,
						value: form.value,
					},
				},
				{
					onError: () => setError(t("admin.coupons.create.error")),
					onSuccess: async () => {
						setForm(emptyCouponForm);
						setError(null);
						await queryClient.invalidateQueries({ queryKey: getCouponsQueryKey() });
					},
				},
			);
		} catch {
			setError(t("admin.coupons.create.dateError"));
		}
	}

	return (
		<form
			className="group space-y-4 rounded-lg border border-border bg-card p-4"
			onSubmit={event => {
				event.preventDefault();
				submit();
			}}
		>
			<div className="grid gap-4 md:grid-cols-2">
				{/* biome-ignore lint/a11y/noLabelWithoutControl: Input is a custom control nested in the label. */}
				<label className="grid gap-2 font-medium text-sm">
					<span>
						{t("admin.coupons.form.code")} <RequiredMark />
					</span>
					<Input
						onBlur={flushCode}
						onChange={event => setLocalCode(event.currentTarget.value.toUpperCase())}
						placeholder={t("admin.coupons.form.codePlaceholder")}
						required
						value={localCode}
					/>
				</label>
				<div className="grid gap-2 font-medium text-sm">
					<span>
						{t("admin.coupons.form.type")} <RequiredMark />
					</span>
					<CustomSelect
						onChange={type => update({ type: type as CouponFormState["type"], value: 0 })}
						options={[
							{ label: t("admin.coupons.types.percent"), value: "percent" },
							{ label: t("admin.coupons.types.fixed"), value: "fixed" },
						]}
						value={form.type}
					/>
				</div>
			</div>
			<CollapsibleFormSection expanded={hasData}>
				<CouponFormFields
					code={localCode}
					onChange={update}
					onCodeBlur={flushCode}
					onCodeChange={setLocalCode}
					showBasics={false}
					units={units}
					value={form}
				/>
				<p className="text-muted-foreground text-sm">{t("admin.coupons.create.hint")}</p>
			</CollapsibleFormSection>
			<div className="flex items-center justify-between gap-4">
				{error && <p className="text-destructive text-sm">{error}</p>}
				<Button
					className="ml-auto"
					disabled={isPending || unitsPending || !localCode.trim() || form.value <= 0}
					type="submit"
				>
					{isPending ? t("admin.coupons.create.submitting") : t("admin.coupons.create.submit")}
				</Button>
			</div>
		</form>
	);
}
