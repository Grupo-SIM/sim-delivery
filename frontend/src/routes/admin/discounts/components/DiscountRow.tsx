import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCircleOff, LuPencil, LuPower, LuTrash2 } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import {
	type GetCategories200,
	type GetDiscounts200,
	type GetProducts200,
	type GetTags200,
	type GetUnits200,
	getDiscountsQueryKey,
	useDeleteDiscountsByDiscountId,
	usePatchDiscountsByDiscountId,
} from "@/lib/api";
import { dateTimeToDate, dateTimeToDigits } from "@/lib/date-time-digits";
import { showAlert, showToast } from "@/stores";
import { DiscountFormFields } from "./DiscountFormFields";
import { type DiscountFormState, isDiscountFormValid } from "./types";

interface DiscountRowProps {
	categories: GetCategories200 | undefined;
	discount: GetDiscounts200[number];
	products: GetProducts200 | undefined;
	tags: GetTags200 | undefined;
	units: GetUnits200 | undefined;
}

function discountToForm(discount: GetDiscounts200[number]): DiscountFormState {
	return {
		categoryIds: discount.categoryIds,
		endsAt: dateTimeToDigits(discount.endsAt),
		kind: discount.kind as DiscountFormState["kind"],
		name: discount.name,
		productIds: discount.productIds,
		startsAt: dateTimeToDigits(discount.startsAt),
		tagIds: discount.tagIds,
		type: discount.type as DiscountFormState["type"],
		unitIds: discount.unitIds,
		value: Number(discount.value),
	};
}

function formatValue(discount: GetDiscounts200[number]) {
	return discount.type === "fixed"
		? `R$ ${(Number(discount.value) / 100).toFixed(2).replace(".", ",")}`
		: `${discount.value}%`;
}

export function DiscountRow({ categories, discount, products, tags, units }: DiscountRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const [form, setForm] = useState(() => discountToForm(discount));
	const update = usePatchDiscountsByDiscountId();
	const remove = useDeleteDiscountsByDiscountId();

	function invalidate() {
		return queryClient.invalidateQueries({ queryKey: getDiscountsQueryKey() });
	}

	function discard() {
		setForm(discountToForm(discount));
		setEditing(false);
	}

	function save() {
		let startsAt: Date | null;
		let endsAt: Date | null;
		try {
			startsAt = dateTimeToDate(form.startsAt);
			endsAt = dateTimeToDate(form.endsAt);
		} catch {
			showToast(t("admin.discounts.dateError"), "negative");
			return;
		}

		update.mutate(
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
				discountId: discount.id,
			},
			{
				onError: () => showToast(t("admin.discounts.edit.error"), "negative"),
				onSuccess: async () => {
					setEditing(false);
					await invalidate();
					showToast(t("admin.discounts.edit.success"), "positive");
				},
			},
		);
	}

	function toggleActive() {
		update.mutate(
			{ data: { active: !discount.active }, discountId: discount.id },
			{
				onError: () => showToast(t("admin.discounts.edit.error"), "negative"),
				onSuccess: () => {
					void invalidate();
					showToast(t(discount.active ? "admin.discounts.row.deactivated" : "admin.discounts.row.activated"), "positive");
				},
			},
		);
	}

	function del() {
		remove.mutate(
			{ discountId: discount.id },
			{
				onError: () => void showAlert(t("admin.discounts.row.deleteError")),
				onSuccess: () => {
					void invalidate();
					showToast(t("admin.discounts.row.deleteSuccess"), "positive");
				},
			},
		);
	}

	const scope = [
		discount.productIds.length > 0 && t("admin.discounts.row.products", { count: discount.productIds.length }),
		discount.categoryIds.length > 0 && t("admin.discounts.row.categories", { count: discount.categoryIds.length }),
		discount.tagIds.length > 0 && t("admin.discounts.row.tags", { count: discount.tagIds.length }),
		discount.productIds.length === 0 &&
			discount.categoryIds.length === 0 &&
			discount.tagIds.length === 0 && t("admin.discounts.form.allProducts"),
	]
		.filter(Boolean)
		.join(" · ");
	const unitScope =
		discount.unitIds.length > 0
			? (units ?? [])
					.filter(unit => discount.unitIds.includes(unit.id))
					.map(unit => unit.name)
					.join(", ")
			: t("admin.discounts.form.allUnits");
	const period =
		discount.startsAt || discount.endsAt
			? `${discount.startsAt ? new Date(discount.startsAt).toLocaleString("pt-BR") : "…"} – ${discount.endsAt ? new Date(discount.endsAt).toLocaleString("pt-BR") : "…"}`
			: t("admin.discounts.row.always");

	return (
		<>
			<tr className="border-border/60 border-b last:border-0">
				<td className="px-4 py-3 font-medium">
					{discount.name}
					{!discount.active && <span className="ml-2 text-destructive text-xs">{t("admin.discounts.row.inactive")}</span>}
				</td>
				<td className="px-4 py-3">
					<Badge tone={discount.kind === "real" ? "success" : "accent"}>
						{t(`admin.discounts.kinds.${discount.kind}`, { defaultValue: discount.kind })}
					</Badge>
				</td>
				<td className="px-4 py-3">{formatValue(discount)}</td>
				<td className="px-4 py-3">{scope}</td>
				<td className="px-4 py-3">{unitScope}</td>
				<td className="px-4 py-3">{period}</td>
				<td className="px-4 py-3 text-right">
					<div className="flex justify-end gap-2">
						<Tooltip content={t("admin.discounts.edit.action")}>
							<Button
								aria-label={t("admin.discounts.edit.action")}
								onClick={() => setEditing(true)}
								size="icon"
								type="button"
								variant="outline"
							>
								<LuPencil className="size-4" />
							</Button>
						</Tooltip>
						<Tooltip content={t(discount.active ? "admin.discounts.row.deactivate" : "admin.discounts.row.activate")}>
							<Button
								aria-label={t(discount.active ? "admin.discounts.row.deactivate" : "admin.discounts.row.activate")}
								disabled={update.isPending}
								onClick={toggleActive}
								size="icon"
								type="button"
								variant="outline"
							>
								{discount.active ? <LuCircleOff className="size-4" /> : <LuPower className="size-4" />}
							</Button>
						</Tooltip>
						<ConfirmActionButton
							aria-label={t("admin.discounts.row.delete")}
							confirmation={t("admin.discounts.row.deleteConfirm", { name: discount.name })}
							confirmLabel={t("admin.discounts.row.delete")}
							disabled={remove.isPending}
							idleIcon={<LuTrash2 className="size-4" />}
							onConfirm={del}
							size="icon"
							type="button"
							variant="outline"
						>
							{t("admin.discounts.row.delete")}
						</ConfirmActionButton>
					</div>
				</td>
			</tr>
			<Modal
				isOpen={editing}
				maxWidth="860px"
				onClose={discard}
				title={t("admin.discounts.edit.action")}
				urlKey="discount-edit"
				urlState={discount.id}
			>
				<div className="space-y-4">
					<DiscountFormFields
						categories={categories}
						onChange={next => setForm(prev => ({ ...prev, ...next }))}
						products={products}
						tags={tags}
						units={units}
						value={form}
					/>
					<div className="flex justify-end gap-2">
						<Button disabled={update.isPending} onClick={discard} type="button" variant="outline">
							{t("admin.discounts.edit.discard")}
						</Button>
						<Button disabled={update.isPending || !isDiscountFormValid(form)} onClick={save} type="button">
							{update.isPending ? t("admin.discounts.edit.saving") : t("admin.discounts.edit.save")}
						</Button>
					</div>
				</div>
			</Modal>
		</>
	);
}
