import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
	getCustomersMeQueryOptions,
	getPublicUnitsQueryOptions,
	type PostCustomersMe200,
	useGetCashbackMe,
	useGetLoyaltyMe,
	usePostCustomersMe,
	usePostOrders,
	usePostPaymentsIntent,
} from "@/lib/api";
import { variantKey } from "@/lib/variant";
import { cartTotalCents, showAlert, useAuthStore, useCartStore, useDeliveryMethodStore } from "@/stores";
import {
	AddressForm,
	type AddressValue,
	type AppliedCoupon,
	type DeliveryMethod,
	IdentifyForm,
	OrderReview,
	PaymentFrame,
	ProfileForm,
	type ProfileValue,
} from "./components";

type Step = "identify" | "profile" | "address" | "review" | "payment";

function CheckoutPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { unitId } = Route.useParams();
	const { isAuthenticated: identified, user } = useAuthStore(state => ({
		isAuthenticated: state.isAuthenticated,
		user: state.user,
	}));
	const cartItems = useCartStore(state => state.items);
	const clearCart = useCartStore(state => state.clear);

	const [profileValue, setProfileValue] = useState<ProfileValue | null>(null);
	const [savedCustomer, setSavedCustomer] = useState<PostCustomersMe200 | null>(null);
	const getMethod = useDeliveryMethodStore(state => state.getMethod);
	const setStoredMethod = useDeliveryMethodStore(state => state.setMethod);
	const { data: units } = useQuery(getPublicUnitsQueryOptions({ variantKey: variantKey ?? "" }));
	const unit = units?.find(u => u.id === unitId);
	const availableMethods = unit?.deliveryMethods ?? ["delivery"];
	const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(() =>
		getMethod(unitId, availableMethods),
	);
	const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
	const [cashbackRedeemCents, setCashbackRedeemCents] = useState(0);
	const [loyaltyRedeemPoints, setLoyaltyRedeemPoints] = useState(0);
	const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
	const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

	const { mutate: saveCustomer, isPending: isSavingCustomer } = usePostCustomersMe();
	const { mutate: placeOrder, isPending: isPlacingOrder } = usePostOrders();
	const { mutate: createPaymentIntent, isPending: isCreatingIntent } = usePostPaymentsIntent();

	const { data: existingCustomer, isLoading: loadingCustomer } = useQuery({
		...getCustomersMeQueryOptions({ variantKey: variantKey ?? "" }),
		enabled: identified && !!variantKey,
	});

	const { data: cashbackData } = useGetCashbackMe(
		{ variantKey: variantKey ?? "" },
		{ query: { enabled: identified && !!variantKey } },
	);
	const cashbackBalanceCents = Number(cashbackData?.balanceCents ?? 0);

	const { data: loyaltyData } = useGetLoyaltyMe(
		{ variantKey: variantKey ?? "" },
		{ query: { enabled: identified && !!variantKey } },
	);
	const loyaltyBalancePoints = Number(loyaltyData?.balancePoints ?? 0);

	const isPickup = deliveryMethod === "pickup";
	const hasCustomer = savedCustomer !== null || existingCustomer !== null;
	const reviewStep: Step =
		!identified || loadingCustomer
			? "identify"
			: !hasCustomer && profileValue === null
				? "profile"
				: !hasCustomer
					? "address"
					: // Existing customer + pickup: skip address entirely
						existingCustomer !== null && savedCustomer === null && !isPickup
						? "address"
						: "review";

	const step: Step = paymentUrl ? "payment" : reviewStep;

	const activeCustomer = savedCustomer ?? existingCustomer ?? null;
	const savedAddress = activeCustomer?.addresses[0] ?? null;

	function handleChangeDeliveryMethod(method: DeliveryMethod) {
		setDeliveryMethod(method);
		setStoredMethod(unitId, method);
	}

	function handleAddressSubmit(address: AddressValue) {
		const profile = profileValue ?? { cpf: existingCustomer?.cpf ?? "", name: user?.name ?? "" };
		saveCustomer(
			{
				data: {
					address: {
						addressLine: address.addressLine,
						city: address.city || undefined,
						complement: address.complement || undefined,
						neighborhood: address.neighborhood || undefined,
						number: address.number,
						reference: address.reference || undefined,
						state: address.state || undefined,
						zipCode: address.zipCode,
					},
					cpf: profile.cpf || undefined,
					name: profile.name,
					variantKey: variantKey ?? "",
				},
			},
			{
				onError: () => void showAlert(t("store.checkout.profile.error")),
				onSuccess: data => setSavedCustomer(data),
			},
		);
	}

	function handlePlaceOrder() {
		if (!activeCustomer || cartItems.length === 0) return;
		placeOrder(
			{
				data: {
					addressId: savedAddress?.id,
					couponCode: appliedCoupon?.code,
					deliveryMethod,
					items: cartItems.map(item => ({
						note: item.note || undefined,
						quantity: item.quantity,
						unitProductId: item.id,
					})),
					redeemCashbackCents: cashbackRedeemCents > 0 ? cashbackRedeemCents : undefined,
					redeemLoyaltyPoints: loyaltyRedeemPoints > 0 ? loyaltyRedeemPoints : undefined,
					unitId,
					variantKey: variantKey ?? "",
				},
			},
			{
				onError: () => void showAlert(t("store.checkout.order.error")),
				onSuccess: order => {
					setPlacedOrderId(order.id);
					createPaymentIntent(
						{ data: { orderId: order.id, variantKey: variantKey ?? "" } },
						{
							onError: () => void showAlert(t("store.checkout.payment.intentError")),
							onSuccess: intent => setPaymentUrl(intent.paymentUrl),
						},
					);
				},
			},
		);
	}

	function handlePaymentConfirmed() {
		clearCart();
		void navigate({
			params: { unitId },
			search: placedOrderId ? { orderId: placedOrderId } : {},
			to: "/$unitId/checkout/thank-you",
		});
	}

	const isPendingOrder = isPlacingOrder || isCreatingIntent;

	return (
		<Container className="max-w-lg space-y-6 py-8">
			{step !== "payment" && (
				<Link className="text-primary text-sm" params={{ unitId }} to="/$unitId">
					← {t("store.checkout.back")}
				</Link>
			)}

			{step === "identify" && (
				<>
					<SectionHeading
						subtitle={t("store.checkout.identify.subtitle")}
						title={t("store.checkout.identify.title")}
					/>
					<IdentifyForm unitId={unitId} />
				</>
			)}

			{step === "profile" && (
				<>
					<SectionHeading
						subtitle={t("store.checkout.profile.subtitle")}
						title={t("store.checkout.profile.title")}
					/>
					<ProfileForm
						initialName={user?.name?.startsWith("+") ? "" : (user?.name ?? "")}
						onSubmit={value => setProfileValue(value)}
					/>
				</>
			)}

			{step === "address" && (
				<>
					<SectionHeading
						subtitle={t("store.checkout.address.subtitle")}
						title={t("store.checkout.address.title")}
					/>
					<AddressForm disabled={isSavingCustomer} onSubmit={handleAddressSubmit} />
				</>
			)}

			{step === "review" && (
				<>
					<SectionHeading
						subtitle={t("store.checkout.order.subtitle")}
						title={t("store.checkout.order.title")}
					/>
					<OrderReview
						address={savedAddress}
						appliedCoupon={appliedCoupon}
						availableMethods={availableMethods}
						cashbackBalanceCents={cashbackBalanceCents}
						cashbackRedeemCents={cashbackRedeemCents}
						deliveryMethod={deliveryMethod}
						isPending={isPendingOrder}
						items={cartItems}
						loyaltyBalancePoints={loyaltyBalancePoints}
						loyaltyRedeemPoints={loyaltyRedeemPoints}
						onChangeCashbackRedeem={setCashbackRedeemCents}
						onChangeDeliveryMethod={handleChangeDeliveryMethod}
						onChangeLoyaltyRedeem={setLoyaltyRedeemPoints}
						onSetCoupon={setAppliedCoupon}
						onSubmit={handlePlaceOrder}
						subtotal={cartTotalCents(cartItems)}
						unitDeliveryFee={Number(unit?.deliveryFee ?? 0)}
						unitId={unitId}
						variantKey={variantKey ?? ""}
					/>
				</>
			)}

			{step === "payment" && paymentUrl && (
				<>
					<SectionHeading
						subtitle={t("store.checkout.payment.subtitle")}
						title={t("store.checkout.payment.title")}
					/>
					<PaymentFrame onConfirmed={handlePaymentConfirmed} paymentUrl={paymentUrl} />
				</>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/$unitId/checkout/")({
	component: CheckoutPage,
});
