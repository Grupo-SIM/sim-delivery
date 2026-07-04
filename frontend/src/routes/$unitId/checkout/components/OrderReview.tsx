import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/formatMoney";
import { postPublicCouponsValidate, type PostCustomersMe200, type PostPublicCouponsValidate200 } from "@/lib/api";
import type { CartItem } from "@/stores";

export type DeliveryMethod = "delivery" | "pickup";
type Address = PostCustomersMe200["addresses"][number];

export type AppliedCoupon = PostPublicCouponsValidate200 & { code: string };

interface OrderReviewProps {
	address: Address | null;
	appliedCoupon: AppliedCoupon | null;
	cashbackBalanceCents: number;
	cashbackRedeemCents: number;
	deliveryMethod: DeliveryMethod;
	items: CartItem[];
	isPending: boolean;
	onChangeDeliveryMethod: (method: DeliveryMethod) => void;
	onChangeCashbackRedeem: (cents: number) => void;
	onSetCoupon: (coupon: AppliedCoupon | null) => void;
	onSubmit: () => void;
	subtotal: number;
	unitDeliveryFee: number;
	unitId: string;
	variantKey: string;
}

export function OrderReview({
	address,
	appliedCoupon,
	cashbackBalanceCents,
	cashbackRedeemCents,
	deliveryMethod,
	items,
	isPending,
	onChangeDeliveryMethod,
	onChangeCashbackRedeem,
	onSetCoupon,
	onSubmit,
	subtotal,
	unitDeliveryFee,
	unitId,
	variantKey,
}: OrderReviewProps) {
	const { t } = useTranslation();
	const [couponInput, setCouponInput] = useState(appliedCoupon?.code ?? "");
	const [couponError, setCouponError] = useState<string | null>(null);
	const [isValidating, setIsValidating] = useState(false);

	const deliveryFee = deliveryMethod === "delivery" ? unitDeliveryFee : 0;
	const discountCents = appliedCoupon?.discountCents ?? 0;
	const total = Math.max(0, subtotal + deliveryFee - discountCents - cashbackRedeemCents);

	async function handleApplyCoupon() {
		if (!couponInput.trim()) return;
		setCouponError(null);
		setIsValidating(true);
		try {
			const result = await postPublicCouponsValidate({
				code: couponInput.trim(),
				orderSubtotal: subtotal,
				unitId,
				variantKey,
			});
			onSetCoupon({ ...result, code: couponInput.trim().toUpperCase() });
		} catch {
			setCouponError(t("store.checkout.order.couponError"));
			onSetCoupon(null);
		} finally {
			setIsValidating(false);
		}
	}

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				{items.map(item => (
					<div className="flex justify-between text-sm" key={item.id}>
						<span>
							{item.quantity}× {item.title}
						</span>
						<span>{formatMoney((item.priceCents * item.quantity) / 100)}</span>
					</div>
				))}
			</div>

			<div className="space-y-2">
				<span className="font-medium text-sm">{t("store.checkout.order.deliveryMethod")}</span>
				<div className="flex gap-2">
					{(["delivery", "pickup"] as DeliveryMethod[]).map(method => (
						<Button
							key={method}
							onClick={() => onChangeDeliveryMethod(method)}
							size="sm"
							type="button"
							variant={deliveryMethod === method ? "default" : "outline"}
						>
							{t(`store.checkout.order.${method}`)}
						</Button>
					))}
				</div>
			</div>

			{address && (
				<div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
					<p className="font-medium">{address.addressLine}, {address.number}</p>
					{address.complement && <p className="text-muted-foreground">{address.complement}</p>}
					<p className="text-muted-foreground">{[address.neighborhood, address.city, address.state].filter(Boolean).join(", ")}</p>
				</div>
			)}

			<div className="space-y-2">
				<span className="font-medium text-sm">{t("store.checkout.order.coupon")}</span>
				{appliedCoupon ? (
					<div className="flex items-center justify-between rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm">
						<span className="font-mono font-semibold text-green-700">{appliedCoupon.code}</span>
						<Button
							onClick={() => { onSetCoupon(null); setCouponInput(""); }}
							size="sm"
							type="button"
							variant="ghost"
						>
							{t("store.checkout.order.couponRemove")}
						</Button>
					</div>
				) : (
					<div className="flex gap-2">
						<Input
							onChange={e => setCouponInput(e.currentTarget.value.toUpperCase())}
							placeholder={t("store.checkout.order.couponPlaceholder")}
							value={couponInput}
						/>
						<Button
							disabled={!couponInput.trim() || isValidating}
							onClick={handleApplyCoupon}
							type="button"
							variant="outline"
						>
							{isValidating ? t("store.checkout.order.couponApplying") : t("store.checkout.order.couponApply")}
						</Button>
					</div>
				)}
				{couponError && <p className="text-destructive text-sm">{couponError}</p>}
			</div>

			{cashbackBalanceCents > 0 && (
				<div className="space-y-2">
					<span className="font-medium text-sm">{t("store.checkout.order.cashback")}</span>
					<div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
						<span className="text-muted-foreground">
							{t("store.checkout.order.cashbackBalance", { amount: formatMoney(cashbackBalanceCents / 100) })}
						</span>
						<Button
							onClick={() =>
								onChangeCashbackRedeem(cashbackRedeemCents > 0 ? 0 : cashbackBalanceCents)
							}
							size="sm"
							type="button"
							variant={cashbackRedeemCents > 0 ? "default" : "outline"}
						>
							{cashbackRedeemCents > 0
								? t("store.checkout.order.cashbackRemove")
								: t("store.checkout.order.cashbackUse")}
						</Button>
					</div>
				</div>
			)}

			<div className="space-y-1 border-border border-t pt-3">
				{deliveryFee > 0 && (
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">{t("store.cart.deliveryFee")}</span>
						<span>{formatMoney(deliveryFee / 100)}</span>
					</div>
				)}
				{discountCents > 0 && (
					<div className="flex justify-between text-sm text-green-700">
						<span>{t("store.checkout.order.discount")}</span>
						<span>−{formatMoney(discountCents / 100)}</span>
					</div>
				)}
				{cashbackRedeemCents > 0 && (
					<div className="flex justify-between text-sm text-green-700">
						<span>{t("store.checkout.order.cashbackRedeemed")}</span>
						<span>−{formatMoney(cashbackRedeemCents / 100)}</span>
					</div>
				)}
				<div className="flex justify-between font-semibold">
					<span>{t("store.checkout.order.total")}</span>
					<span>{formatMoney(total / 100)}</span>
				</div>
			</div>

			<Button className="w-full" disabled={isPending} onClick={onSubmit} type="button">
				{isPending ? t("store.checkout.order.placing") : t("store.checkout.order.place")}
			</Button>
		</div>
	);
}
