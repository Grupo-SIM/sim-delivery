import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	type PostCustomersMe200,
	type PostPublicCouponsValidate200,
	postPublicCouponsValidate,
	usePostPublicFreightSimulate,
} from "@/lib/api";
import { formatMoney } from "@/lib/formatMoney";
import type { CartItem } from "@/stores";
import { CheckoutItemRow } from "./CheckoutItemRow";

export type DeliveryMethod = "delivery" | "pickup";
type Address = PostCustomersMe200["addresses"][number];

export type AppliedCoupon = PostPublicCouponsValidate200 & { code: string };

interface OrderReviewProps {
	address: Address | null;
	appliedCoupon: AppliedCoupon | null;
	availableMethods: string[];
	cashbackBalanceCents: number;
	cashbackRedeemCents: number;
	deliveryMethod: DeliveryMethod;
	items: CartItem[];
	isPending: boolean;
	loyaltyBalancePoints: number;
	loyaltyRedeemPoints: number;
	onChangeCashbackRedeem: (cents: number) => void;
	onChangeDeliveryMethod: (method: DeliveryMethod) => void;
	onChangeLoyaltyRedeem: (points: number) => void;
	onOpenAddressSelector: () => void;
	onSetCoupon: (coupon: AppliedCoupon | null) => void;
	onSubmit: () => void;
	subtotal: number;
	unitDeliveryFee: number;
	unitId: string;
	slug: string;
}

export function OrderReview({
	address,
	appliedCoupon,
	availableMethods,
	cashbackBalanceCents,
	cashbackRedeemCents,
	deliveryMethod,
	items,
	isPending,
	loyaltyBalancePoints,
	loyaltyRedeemPoints,
	onChangeCashbackRedeem,
	onChangeDeliveryMethod,
	onChangeLoyaltyRedeem,
	onOpenAddressSelector,
	onSetCoupon,
	onSubmit,
	subtotal,
	unitDeliveryFee,
	unitId,
	slug,
}: OrderReviewProps) {
	const { t } = useTranslation();
	const [couponInput, setCouponInput] = useState(appliedCoupon?.code ?? "");
	const [couponError, setCouponError] = useState<string | null>(null);
	const [isValidating, setIsValidating] = useState(false);
	const {
		data: freight,
		error: freightError,
		isPending: isSimulatingFreight,
		mutate: simulateFreight,
	} = usePostPublicFreightSimulate();

	useEffect(() => {
		if (deliveryMethod !== "delivery" || address?.latitude == null || address?.longitude == null) return;
		simulateFreight({ data: { latitude: address.latitude, longitude: address.longitude, slug, unitId } });
	}, [address?.latitude, address?.longitude, deliveryMethod, simulateFreight, slug, unitId]);

	const hasCoordinates = address?.latitude != null && address?.longitude != null;
	const deliveryFee = deliveryMethod === "pickup" ? 0 : hasCoordinates && freight ? Number(freight.deliveryFee) : unitDeliveryFee;
	const blockedByFreight = deliveryMethod === "delivery" && hasCoordinates && (isSimulatingFreight || !!freightError);
	const discountCents = Number(appliedCoupon?.discountCents ?? 0);
	const total = Math.max(0, subtotal + deliveryFee - discountCents - cashbackRedeemCents - loyaltyRedeemPoints);

	async function handleApplyCoupon() {
		if (!couponInput.trim()) return;
		setCouponError(null);
		setIsValidating(true);
		try {
			const result = await postPublicCouponsValidate({ code: couponInput.trim(), orderSubtotal: subtotal, slug, unitId });
			onSetCoupon({ ...result, code: couponInput.trim().toUpperCase() });
		} catch {
			setCouponError(t("store.checkout.order.couponError"));
			onSetCoupon(null);
		} finally {
			setIsValidating(false);
		}
	}

	return (
		<div className="space-y-5">
			<section className="divide-y divide-border/70">
				{items.map(item => <CheckoutItemRow item={item} key={item.lineKey} />)}
			</section>

			{availableMethods.length > 1 && (
				<section className="space-y-2">
					<span className="font-semibold text-sm">{t("store.checkout.order.deliveryMethod")}</span>
					<div className="grid grid-cols-2 gap-2">
						{(["delivery", "pickup"] as DeliveryMethod[])
							.filter(method => availableMethods.includes(method))
							.map(method => (
								<Button
									className="w-full"
									key={method}
									onClick={() => onChangeDeliveryMethod(method)}
									type="button"
									variant={deliveryMethod === method ? "default" : "outline"}
								>
									{t(`store.checkout.order.${method}`)}
								</Button>
							))}
					</div>
				</section>
			)}

			{deliveryMethod === "delivery" && (
				<section className="space-y-2">
					<span className="font-semibold text-sm">{t("store.checkout.order.deliveryAddress")}</span>
					{address ? (
						<div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="font-medium">{address.addressLine}, {address.number}</p>
									{address.complement && <p className="text-muted-foreground">{address.complement}</p>}
									<p className="text-muted-foreground">{[address.neighborhood, address.city, address.state].filter(Boolean).join(", ")}</p>
								</div>
								<Button className="shrink-0 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20" onClick={onOpenAddressSelector} size="sm" type="button" variant="outline">
									{t("store.checkout.address.change")}
								</Button>
							</div>
							{hasCoordinates && (
								<p className="mt-2 text-muted-foreground text-xs">
									{isSimulatingFreight && t("store.checkout.order.freightCalculating")}
									{!isSimulatingFreight && freightError && t("store.checkout.order.freightError")}
									{!isSimulatingFreight && !freightError && freight?.etaMinMinutes != null && freight.etaMaxMinutes != null && t("store.checkout.order.freightEta", { max: Number(freight.etaMaxMinutes), min: Number(freight.etaMinMinutes) })}
								</p>
							)}
						</div>
					) : (
						<Button className="w-full" onClick={onOpenAddressSelector} type="button" variant="outline">
							{t("store.checkout.address.add")}
						</Button>
					)}
				</section>
			)}

			<section className="space-y-2">
				<span className="font-semibold text-sm">{t("store.checkout.order.coupon")}</span>
				{appliedCoupon ? (
					<div className="flex items-center justify-between rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm">
						<span className="font-mono font-semibold text-green-700">{appliedCoupon.code}</span>
						<Button onClick={() => { onSetCoupon(null); setCouponInput(""); }} size="sm" type="button" variant="outline">{t("store.checkout.order.couponRemove")}</Button>
					</div>
				) : (
					<div className="flex gap-2">
						<Input onChange={event => setCouponInput(event.currentTarget.value.toUpperCase())} placeholder={t("store.checkout.order.couponPlaceholder")} value={couponInput} />
						<Button disabled={!couponInput.trim() || isValidating} onClick={handleApplyCoupon} type="button" variant="outline">{isValidating ? t("store.checkout.order.couponApplying") : t("store.checkout.order.couponApply")}</Button>
					</div>
				)}
				{couponError && <p className="text-destructive text-sm">{couponError}</p>}
			</section>

			{cashbackBalanceCents > 0 && (
				<section className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
					<span>{t("store.checkout.order.cashbackBalance", { amount: formatMoney(cashbackBalanceCents / 100) })}</span>
					<Button onClick={() => onChangeCashbackRedeem(cashbackRedeemCents > 0 ? 0 : cashbackBalanceCents)} size="sm" type="button" variant={cashbackRedeemCents > 0 ? "default" : "outline"}>{cashbackRedeemCents > 0 ? t("store.checkout.order.cashbackRemove") : t("store.checkout.order.cashbackUse")}</Button>
				</section>
			)}

			{loyaltyBalancePoints > 0 && (
				<section className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
					<span>{t("store.checkout.order.loyaltyBalance", { amount: formatMoney(loyaltyBalancePoints / 100), points: loyaltyBalancePoints })}</span>
					<Button onClick={() => onChangeLoyaltyRedeem(loyaltyRedeemPoints > 0 ? 0 : loyaltyBalancePoints)} size="sm" type="button" variant={loyaltyRedeemPoints > 0 ? "default" : "outline"}>{loyaltyRedeemPoints > 0 ? t("store.checkout.order.loyaltyRemove") : t("store.checkout.order.loyaltyUse")}</Button>
				</section>
			)}

			<section className="space-y-2 border-border border-t pt-4 text-sm">
				<div className="flex justify-between"><span className="text-muted-foreground">{t("store.checkout.order.itemsSubtotal")}</span><span>{formatMoney(subtotal / 100)}</span></div>
				{deliveryMethod === "delivery" && (
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("store.cart.deliveryFee")}</span>
						<span>{isSimulatingFreight ? t("store.checkout.order.freightCalculating") : formatMoney(deliveryFee / 100)}</span>
					</div>
				)}
				{discountCents > 0 && <div className="flex justify-between text-green-700"><span>{t("store.checkout.order.discount")}</span><span>−{formatMoney(discountCents / 100)}</span></div>}
				{cashbackRedeemCents > 0 && <div className="flex justify-between text-green-700"><span>{t("store.checkout.order.cashbackRedeemed")}</span><span>−{formatMoney(cashbackRedeemCents / 100)}</span></div>}
				{loyaltyRedeemPoints > 0 && <div className="flex justify-between text-green-700"><span>{t("store.checkout.order.loyaltyRedeemed")}</span><span>−{formatMoney(loyaltyRedeemPoints / 100)}</span></div>}
				<div className="flex justify-between border-border border-t pt-3 font-bold text-base"><span>{t("store.checkout.order.total")}</span><span>{formatMoney(total / 100)}</span></div>
			</section>

			<Button className="w-full" disabled={isPending || blockedByFreight || (deliveryMethod === "delivery" && !address)} onClick={onSubmit} type="button">{isPending ? t("store.checkout.order.placing") : t("store.checkout.order.place")}</Button>
		</div>
	);
}
