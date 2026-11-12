import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { dateTimeToDate } from "@/lib/date-time-digits";
import {
	type GetCategories200,
	getDiscountsQueryKey,
	type GetProducts200, type GetTags200, type GetUnits200, 	usePostDiscounts,
} from "@/lib/api";
import { showToast } from "@/stores";
import { DiscountFormFields } from "./DiscountFormFields";
import { type DiscountFormState, emptyDiscountForm, isDiscountFormValid } from "./types";

interface CreateDiscountFormProps {
	categories: GetCategories200 | undefined;
	products: GetProducts200 | undefined;
	tags: GetTags200 | undefined;
	units: GetUnits200 | undefined;
}

export function CreateDiscountForm({ categories, products, tags, units }: CreateDiscountFormProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [form, setForm] = useState<DiscountFormState>(emptyDiscountForm);
	const [formKey, setFormKey] = useState(0);
	const { isPending, mutate } = usePostDiscounts();

	function submit() {
		let startsAt: Date | null;
		let endsAt: Date | null;
		try {
			startsAt = dateTimeToDate(form.startsAt);
			endsAt = dateTimeToDate(form.endsAt);
		} catch {
			showToast(t("admin.discounts.dateError"), "negative");
			return;
		}

		mutate(
			{
				data: {
					categoryIds: form.categoryIds,
					endsAt,
					kind: form.kind,
					name: form.name.trim(),
					productIds: form.productIds,
					startsAt,
					tagIds: form.tagIds,
					type: form.type,
					unitIds: form.unitIds,
					value: form.value,
				},
			},
			{
				onError: () => showToast(t("admin.discounts.create.error"), "negative"),
				onSuccess: async () => {
					setForm(emptyDiscountForm);
					setFormKey(key => key + 1);
					await queryClient.invalidateQueries({ queryKey: getDiscountsQueryKey() });
					showToast(t("admin.discounts.create.success"), "positive");
				},
			},
		);
	}

	return (
		<form
			className="space-y-4 rounded-lg border border-border bg-card p-4 text-card-foreground"
			onSubmit={event => {
				event.preventDefault();
				submit();
			}}
		>
			<h2 className="font-semibold">{t("admin.discounts.create.heading")}</h2>
			<DiscountFormFields
				categories={categories}
				key={formKey}
				onChange={next => setForm(prev => ({ ...prev, ...next }))}
				products={products}
				tags={tags}
				units={units}
				value={form}
			/>
			<div className="flex justify-end">
				<Button disabled={isPending || !isDiscountFormValid(form)} type="submit">
					{isPending ? t("admin.discounts.create.submitting") : t("admin.discounts.create.submit")}
				</Button>
			</div>
		</form>
	);
}
