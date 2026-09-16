import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	type PostCustomersMe200,
	postPublicCouponsValidate,
	usePostOrdersFeesQuote,
	usePostPublicFreightSimulate,
} from "@/lib/api";
import { formatMoney } from "@/lib/formatMoney";
import type { AppliedCoupon, CartItem } from "@/stores";
import { CheckoutItemRow } from "./CheckoutItemRow";

export type DeliveryMethod = "delivery" | "pickup";
type Address = PostCustomersMe200["addresses"][number];

export type { AppliedCoupon } from "@/stores";

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
	onEditItem: (item: CartItem) => void;
	onOpenAddressSelector: () => void;
	onOpenAddressCreator: () => void;
	onSetCoupon: (coupon: AppliedCoupon | null) => void;
	onSubmit: () => void;
	subtotal: number;
	unitDeliveryFee: number;
	unitId: string;
	unitSlug: string;
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
	onEditItem,
	onOpenAddressSelector,
	onOpenAddressCreator,
	onSetCoupon,
	onSubmit,
	subtotal,
	unitDeliveryFee,
	unitId,
	unitSlug,
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
	const {
		data: feeQuote,
		error: feeQuoteError,
		isPending: isQuotingFees,
		mutate: quoteFees,
	} = usePostOrdersFeesQuote();

	useEffect(() => {
		if (items.length === 0 || !slug) return;
		quoteFees({
			data: {
				items: items.map(item => ({
					options: item.options.map(option => ({ optionId: option.optionId, quantity: option.quantity })),
					quantity: item.quantity,
					unitProductId: item.id,
				})),
				slug,
				unitSlug,
			},
		});
	}, [items, quoteFees, slug, unitSlug]);

	useEffect(() => {
		if (deliveryMethod !== "delivery" || address?.latitude == null || address?.longitude == null) return;
		simulateFreight({ data: { latitude: address.latitude, longitude: address.longitude, slug, unitId } });
	}, [address?.latitude, address?.longitude, deliveryMethod, simulateFreight, slug, unitId]);

	const hasCoordinates = address?.latitude != null && address?.longitude != null;
	const deliveryFee =
		deliveryMethod === "pickup"
			? 0
			: hasCoordinates && freight
				? Number(freight.deliveryFee)
				: unitDeliveryFee;
	const blockedByFreight =
		deliveryMethod === "delivery" && hasCoordinates && (isSimulatingFreight || !!freightError);
	const discountCents = Number(appliedCoupon?.discountCents ?? 0);
	const feeTotalCents = Number(feeQuote?.feeTotalCents ?? 0);
	const embeddedFeeTotalCents = Number(feeQuote?.embeddedFeeTotalCents ?? 0);
	const subtotalAfterCoupon = Math.max(0, subtotal - discountCents);
	const appliedCashbackCents = Math.min(cashbackRedeemCents, subtotalAfterCoupon);
	const appliedLoyaltyPoints = Math.min(loyaltyRedeemPoints, subtotalAfterCoupon - appliedCashbackCents);
	const remainingSubtotal = subtotalAfterCoupon - appliedCashbackCents - appliedLoyaltyPoints;
	const total = remainingSubtotal + deliveryFee + feeTotalCents;

	async function handleApplyCoupon() {
		if (!couponInput.trim()) return;
		setCouponError(null);
		setIsValidating(true);
		try {
			const result = await postPublicCouponsValidate({
				code: couponInput.trim(),
				orderSubtotal: subtotal,
				slug,
				unitId,
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
		<div className="space-y-5">
			<section className="divide-y divide-border/70">
				{items.map(item => (
					<CheckoutItemRow item={item} key={item.lineKey} onEdit={onEditItem} />
				))}
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
					<span className="font-semibold text-sm">
						{t("store.checkout.order.deliveryAddress")} <span className="text-destructive">*</span>
					</span>
					{address ? (
						<div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="font-medium">
										{address.addressLine}, {address.number}
									</p>
									{address.complement && <p className="text-muted-foreground">{address.complement}</p>}
									<p className="text-muted-foreground">
										{[address.neighborhood, address.city, address.state].filter(Boolean).join(", ")}
									</p>
								</div>
								<Button
									className="shrink-0 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
									onClick={onOpenAddressSelector}
									size="sm"
									type="button"
									variant="outline"
								>
									{t("store.checkout.address.change")}
								</Button>
							</div>
							{hasCoordinates && (
								<p className="mt-2 text-muted-foreground text-xs">
									{isSimulatingFreight && t("store.checkout.order.freightCalculating")}
									{!isSimulatingFreight && freightError && t("store.checkout.order.freightError")}
									{!isSimulatingFreight &&
										!freightError &&
										freight?.etaMinMinutes != null &&
										freight.etaMaxMinutes != null &&
										t("store.checkout.order.freightEta", {
											max: Number(freight.etaMaxMinutes),
											min: Number(freight.etaMinMinutes),
										})}
								</p>
							)}
						</div>
					) : (
						<>
							<Button className="w-full" onClick={onOpenAddressCreator} type="button" variant="outline">
								{t("store.checkout.address.add")}
							</Button>
							<p className="text-destructive text-xs">Endereço obrigatório para fazer o pedido.</p>
						</>
					)}
				</section>
			)}

			{deliveryMethod === "pickup" && (
				<section className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm">
					<p className="text-muted-foreground">{t("store.checkout.order.pickupDetails")}</p>
				</section>
			)}

			<section className="space-y-2">
				<span className="font-semibold text-sm">{t("store.checkout.order.coupon")}</span>
				{appliedCoupon ? (
					<div className="flex items-center justify-between rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm">
						<span className="font-mono font-semibold text-success">{appliedCoupon.code}</span>
						<Button
							onClick={() => {
								onSetCoupon(null);
								setCouponInput("");
							}}
							size="sm"
							type="button"
							variant="outline"
						>
							{t("store.checkout.order.couponRemove")}
						</Button>
					</div>
				) : (
					<div className="flex gap-2">
						<Input
							onChange={event => setCouponInput(event.currentTarget.value.toUpperCase())}
							placeholder={t("store.checkout.order.couponPlaceholder")}
							value={couponInput}
						/>
						<Button
							disabled={!couponInput.trim() || isValidating}
							onClick={handleApplyCoupon}
							type="button"
							variant="outline"
						>
							{isValidating
								? t("store.checkout.order.couponApplying")
								: t("store.checkout.order.couponApply")}
						</Button>
					</div>
				)}
				{couponError && <p className="text-destructive text-sm">{couponError}</p>}
			</section>

			{cashbackBalanceCents > 0 && (
				<section className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
					<span>
						{t("store.checkout.order.cashbackBalance", { amount: formatMoney(cashbackBalanceCents / 100) })}
					</span>
					<Button
						onClick={() => onChangeCashbackRedeem(cashbackRedeemCents > 0 ? 0 : Math.min(cashbackBalanceCents, subtotalAfterCoupon))}
						size="sm"
						type="button"
						variant={cashbackRedeemCents > 0 ? "default" : "outline"}
					>
						{cashbackRedeemCents > 0
							? t("store.checkout.order.cashbackRemove")
							: t("store.checkout.order.cashbackUse")}
					</Button>
				</section>
			)}

			{loyaltyBalancePoints > 0 && (
				<section className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
					<span>
						{t("store.checkout.order.loyaltyBalance", {
							amount: formatMoney(loyaltyBalancePoints / 100),
							points: loyaltyBalancePoints,
						})}
					</span>
					<Button
						onClick={() => onChangeLoyaltyRedeem(loyaltyRedeemPoints > 0 ? 0 : Math.min(loyaltyBalancePoints, subtotalAfterCoupon - appliedCashbackCents))}
						size="sm"
						type="button"
						variant={loyaltyRedeemPoints > 0 ? "default" : "outline"}
					>
						{loyaltyRedeemPoints > 0
							? t("store.checkout.order.loyaltyRemove")
							: t("store.checkout.order.loyaltyUse")}
					</Button>
				</section>
			)}

			<section className="space-y-2 border-border border-t pt-4 text-sm">
				{feeQuoteError && <p className="text-destructive">{t("store.checkout.order.feesError")}</p>}
				<div className="flex justify-between">
					<span className="text-muted-foreground">{t("store.checkout.order.itemsSubtotal")}</span>
					<span>{formatMoney((subtotal + embeddedFeeTotalCents) / 100)}</span>
				</div>
				{feeQuote?.fees
					.filter(fee => fee.displayMode !== "embedded")
					.map(fee => (
						<div className="flex justify-between" key={fee.id}>
							<span className="text-muted-foreground">{fee.name}</span>
							<span>+{formatMoney(Number(fee.amountCents) / 100)}</span>
						</div>
					))}
				{Number(feeQuote?.visibleFeeTotalCents ?? 0) > 0 && (
					<div className="flex justify-between font-medium">
						<span>{t("store.checkout.order.feesTotal")}</span>
						<span>{formatMoney(Number(feeQuote?.visibleFeeTotalCents ?? 0) / 100)}</span>
					</div>
				)}
				{deliveryMethod === "delivery" && (
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("store.cart.deliveryFee")}</span>
						<span>
							{isSimulatingFreight
								? t("store.checkout.order.freightCalculating")
								: formatMoney(deliveryFee / 100)}
						</span>
					</div>
				)}
				{discountCents > 0 && (
					<div className="flex justify-between text-success">
						<span>{t("store.checkout.order.discount")}</span>
						<span>−{formatMoney(discountCents / 100)}</span>
					</div>
				)}
				{appliedCashbackCents > 0 && (
					<div className="flex justify-between text-success">
						<span>{t("store.checkout.order.cashbackRedeemed")}</span>
						<span>−{formatMoney(appliedCashbackCents / 100)}</span>
					</div>
				)}
				{appliedLoyaltyPoints > 0 && (
					<div className="flex justify-between text-success">
						<span>{t("store.checkout.order.loyaltyRedeemed")}</span>
						<span>−{formatMoney(appliedLoyaltyPoints / 100)}</span>
					</div>
				)}
				<div className="flex justify-between border-border border-t pt-3 font-bold text-base">
					<span>{t("store.checkout.order.total")}</span>
					<span>{formatMoney(total / 100)}</span>
				</div>
			</section>

			<Button
				className="w-full"
				disabled={
					isPending ||
					isQuotingFees ||
					!!feeQuoteError ||
					!feeQuote ||
					blockedByFreight ||
					(deliveryMethod === "delivery" && !address)
				}
				onClick={onSubmit}
				type="button"
			>
				{isPending ? t("store.checkout.order.placing") : t("store.checkout.order.place")}
			</Button>
		</div>
	);
}
