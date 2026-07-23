import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCircleOff, LuPencil, LuPower, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Modal } from "@/components/ui/Modal";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	type GetCoupons200,
	type GetUnits200,
	getCouponsQueryKey,
	useDeleteCouponsByCouponId,
	usePatchCouponsByCouponId,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import { CouponFormFields } from "./CouponFormFields";
import { dateTimeToDate, dateTimeToDigits, type CouponFormState } from "./types";

interface CouponRowProps {
	coupon: GetCoupons200[number];
	units: GetUnits200 | undefined;
}

function couponToForm(coupon: GetCoupons200[number]): CouponFormState {
	return {
		code: coupon.code,
		expiresAt: dateTimeToDigits(coupon.expiresAt),
		maxUses: coupon.maxUses === null ? null : Number(coupon.maxUses),
		minOrderCents: Number(coupon.minOrderCents),
		type: coupon.type as CouponFormState["type"],
		unitId: coupon.unitId,
		value: Number(coupon.value),
	};
}

export function CouponRow({ coupon, units }: CouponRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const [form, setForm] = useState(() => couponToForm(coupon));
	const [localCode, setLocalCode, flushCode] = useDebouncedInput(form.code, code => setForm(prev => ({ ...prev, code })));
	const update = usePatchCouponsByCouponId();
	const remove = useDeleteCouponsByCouponId();

	function invalidate() {
		return queryClient.invalidateQueries({ queryKey: getCouponsQueryKey() });
	}

	function cancel() {
		setForm(couponToForm(coupon));
		setEditing(false);
	}

	function save() {
		flushCode();
		try {
			update.mutate(
				{
					couponId: coupon.id,
					data: {
						code: localCode.trim(),
						expiresAt: dateTimeToDate(form.expiresAt),
						maxUses: form.maxUses,
						minOrderCents: form.minOrderCents,
						type: form.type,
						unitId: form.unitId,
						value: form.value,
					},
				},
				{
					onError: () => showToast(t("admin.coupons.edit.error"), "negative"),
					onSuccess: async () => {
						setEditing(false);
						await invalidate();
						showToast(t("admin.coupons.edit.success"), "positive");
					},
				},
			);
		} catch {
			showToast(t("admin.coupons.create.dateError"), "negative");
		}
	}

	function del() {
		remove.mutate(
			{ couponId: coupon.id },
			{
				onError: () => void showAlert(t("admin.coupons.row.deleteError")),
				onSuccess: () => {
					void invalidate();
					showToast(t("admin.coupons.row.deleteSuccess"), "positive");
				},
			},
		);
	}

	function toggleActive() {
		update.mutate(
			{ couponId: coupon.id, data: { active: !coupon.active } },
			{
				onError: () => showToast(t("admin.coupons.edit.error"), "negative"),
				onSuccess: () => {
					void invalidate();
					showToast(coupon.active ? "Cupom desativado" : "Cupom ativado", "positive");
				},
			},
		);
	}

	const unit = units?.find(item => item.id === coupon.unitId);
	const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleString("pt-BR") : t("admin.coupons.row.never");
	const value = coupon.type === "fixed" ? `R$ ${(Number(coupon.value) / 100).toFixed(2).replace(".", ",")}` : `${coupon.value}%`;

	return (
		<>
			<tr className="border-border/60 border-b last:border-0">
				<td className="px-4 py-3 font-mono font-medium">
					{coupon.code} {!coupon.active && <span className="ml-2 text-destructive text-xs">Inativo</span>}
				</td>
				<td className="px-4 py-3">{coupon.type === "fixed" ? t("admin.coupons.types.fixed") : t("admin.coupons.types.percent")}</td>
				<td className="px-4 py-3">{value}</td>
				<td className="px-4 py-3">{unit?.name ?? t("admin.coupons.row.allUnits")}</td>
				<td className="px-4 py-3">{expiresAt}</td>
				<td className="w-52 px-4 py-3 text-right">
					<div className="flex justify-end gap-2">
						<Button onClick={() => setEditing(true)} size="sm" type="button" variant="outline">
							<LuPencil className="size-4" />
							{t("admin.coupons.edit.action")}
						</Button>
						<ConfirmActionButton
							confirmation={coupon.active ? "Clique novamente para desativar" : "Clique novamente para ativar"}
							confirmLabel={coupon.active ? "Desativar" : "Ativar"}
							disabled={update.isPending}
							idleIcon={coupon.active ? <LuCircleOff className="size-4" /> : <LuPower className="size-4" />}
							onConfirm={toggleActive}
							size="sm"
							type="button"
							variant="outline"
						>
							{coupon.active ? "Desativar" : "Ativar"}
						</ConfirmActionButton>
						<ConfirmActionButton
							confirmation={t("admin.coupons.row.deleteConfirm", { code: coupon.code })}
							confirmLabel={t("admin.coupons.row.delete")}
							disabled={remove.isPending}
							idleIcon={<LuTrash2 className="size-4" />}
							onConfirm={del}
							size="sm"
							type="button"
							variant="outline"
						>
							{t("admin.coupons.row.delete")}
						</ConfirmActionButton>
					</div>
				</td>
			</tr>
			<Modal isOpen={editing} maxWidth="760px" onClose={cancel} title={t("admin.coupons.edit.action")}>
				<div className="space-y-4">
					<CouponFormFields
						code={localCode}
						onChange={next => setForm(prev => ({ ...prev, ...next }))}
						onCodeBlur={flushCode}
						onCodeChange={setLocalCode}
						units={units}
						value={form}
					/>
					<div className="flex justify-end gap-2">
						<Button disabled={update.isPending} onClick={cancel} type="button" variant="outline">
							{t("admin.coupons.edit.cancel")}
						</Button>
						<Button disabled={update.isPending || !localCode.trim() || form.value <= 0} onClick={save} type="button">
							{update.isPending ? t("admin.coupons.edit.saving") : t("admin.coupons.edit.save")}
						</Button>
					</div>
				</div>
			</Modal>
		</>
	);
}
