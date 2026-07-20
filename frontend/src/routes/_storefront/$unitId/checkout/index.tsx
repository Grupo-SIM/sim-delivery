import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	getCustomersMeQueryOptions,
	getPublicUnitsQueryOptions,
	type PostCustomersMe200,
	useGetCashbackMe,
	useGetLoyaltyMe,
	usePostCustomersMe,
	usePostOrders,
} from "@/lib/api";
import { slug } from "@/lib/variant";
import { cartTotalCents, showAlert, useAuthStore, useCartStore, useDeliveryMethodStore } from "@/stores";
import {
	AddressForm,
	AddressSelectorModal,
	type AddressValue,
	type AppliedCoupon,
	type DeliveryMethod,
	IdentifyForm,
	OrderReview,
	PaymentStep,
	ProfileForm,
	type ProfileValue,
} from "./components";

type Step = "identify" | "profile" | "review" | "payment";

function CheckoutPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { unitId: unitSlug } = Route.useParams();
	const identified = useAuthStore(state => state.isAuthenticated);
	const user = useAuthStore(state => state.user);
	const cartItems = useCartStore(state => state.items);
	const clearCart = useCartStore(state => state.clear);

	const [profileValue, setProfileValue] = useState<ProfileValue | null>(null);
	const [savedCustomer, setSavedCustomer] = useState<PostCustomersMe200 | null>(null);
	const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
	const [addressModalOpen, setAddressModalOpen] = useState(false);
	const getMethod = useDeliveryMethodStore(state => state.getMethod);
	const setStoredMethod = useDeliveryMethodStore(state => state.setMethod);
	const { data: units, isPending: loadingUnits } = useQuery(getPublicUnitsQueryOptions({ slug: slug ?? "" }));
	const unit = units?.find(u => u.slug === unitSlug);
	const unitId = unit?.id ?? "";
	const availableMethods = unit?.deliveryMethods ?? ["delivery"];
	const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(() =>
		getMethod(unitId, availableMethods),
	);
	const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
	const [cashbackRedeemCents, setCashbackRedeemCents] = useState(0);
	const [loyaltyRedeemPoints, setLoyaltyRedeemPoints] = useState(0);
	const [placedOrder, setPlacedOrder] = useState<{ id: string; totalCents: number } | null>(null);

	const { mutate: saveCustomer, isPending: isSavingCustomer } = usePostCustomersMe({
		// Customer response is stored locally after submit. Avoid Kubb's broad
		// "Customers" mutation invalidation causing an unnecessary GET during checkout.
		mutation: { mutationKey: ["checkout-customer"] },
	});
	const { mutate: placeOrder, isPending: isPlacingOrder } = usePostOrders();

	const { data: existingCustomer, isLoading: loadingCustomer } = useQuery({
		...getCustomersMeQueryOptions({ slug: slug ?? "" }),
		// Profile cannot change while this screen is open. Fetch once, then keep its
		// result through component remounts; POST /customers/me returns saved profile.
		gcTime: Number.POSITIVE_INFINITY,
		enabled: identified && !!slug,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const { data: cashbackData } = useGetCashbackMe(
		{ slug: slug ?? "" },
		{ query: { enabled: identified && !!slug } },
	);
	const cashbackBalanceCents = Number(cashbackData?.balanceCents ?? 0);

	const { data: loyaltyData } = useGetLoyaltyMe(
		{ slug: slug ?? "" },
		{ query: { enabled: identified && !!slug } },
	);
	const loyaltyBalancePoints = Number(loyaltyData?.balancePoints ?? 0);

	const activeCustomer = savedCustomer ?? existingCustomer ?? null;
	const addresses: PostCustomersMe200["addresses"] = activeCustomer?.addresses ?? [];
	const savedAddress =
		addresses.find(address => address.id === selectedAddressId) ?? addresses.find(address => address.isDefault) ?? null;
	const hasCustomer = activeCustomer !== null;
	// Magic-link/OTP accounts can end up with a blank name; without one we can't skip
	// straight to address (the save would submit an empty name and fail server-side).
	const hasUsableName = !!user?.name?.trim();
	const reviewStep: Step =
		!identified || loadingCustomer
			? "identify"
			: !hasCustomer && profileValue === null
				? "profile"
				: existingCustomer !== null && savedCustomer === null && !hasUsableName && profileValue === null
					? "profile"
					: "review";

	const step: Step = placedOrder ? "payment" : reviewStep;

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
						latitude: address.latitude,
						longitude: address.longitude,
						neighborhood: address.neighborhood || undefined,
						number: address.number,
						reference: address.reference || undefined,
						state: address.state || undefined,
						zipCode: address.zipCode,
					},
					cpf: profile.cpf || undefined,
					name: profile.name,
					slug: slug ?? "",
				},
			},
			{
				onError: () => void showAlert(t("store.checkout.profile.error")),
				onSuccess: data => {
					setSavedCustomer(data);
					setSelectedAddressId(data.addresses.find(address => address.isDefault)?.id ?? null);
					setAddressModalOpen(false);
				},
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
						options: item.options.map(option => ({
							optionId: option.optionId,
							quantity: option.quantity,
						})),
						quantity: item.quantity,
						unitProductId: item.id,
					})),
					redeemCashbackCents: cashbackRedeemCents > 0 ? cashbackRedeemCents : undefined,
					redeemLoyaltyPoints: loyaltyRedeemPoints > 0 ? loyaltyRedeemPoints : undefined,
					slug: slug ?? "",
					unitId,
				},
			},
			{
				onError: () => void showAlert(t("store.checkout.order.error")),
				onSuccess: order => setPlacedOrder({ id: order.id, totalCents: Number(order.total) }),
			},
		);
	}

	function handlePaymentConfirmed() {
		clearCart();
		if (!placedOrder) return;
		void navigate({
			params: { orderId: placedOrder.id, unitId: unitSlug },
			to: "/$unitId/orders/$orderId",
		});
	}

	const isPendingOrder = isPlacingOrder;

	if (loadingUnits || (identified && loadingCustomer)) {
		return (
			<Container className="max-w-lg space-y-6 py-8">
				<Skeleton className="h-5 w-28" />
				<div className="space-y-3">
					<Skeleton className="h-8 w-64 max-w-full" />
					<Skeleton className="h-4 w-full" />
				</div>
				<div className="space-y-4 rounded-xl border border-border p-5">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
			</Container>
		);
	}

	return (
		<Container className="max-w-lg space-y-6 py-8">
			{step !== "payment" && (
				<Link className="text-primary text-sm" params={{ unitId: unitSlug }} to="/$unitId">
					← {t("store.checkout.back")}
				</Link>
			)}

			{step === "identify" && (
				<>
					<SectionHeading
						subtitle={t("store.checkout.identify.subtitle")}
						title={t("store.checkout.identify.title")}
					/>
					<IdentifyForm unitSlug={unitSlug} />
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
						onOpenAddressSelector={() => setAddressModalOpen(true)}
						onSetCoupon={setAppliedCoupon}
						onSubmit={handlePlaceOrder}
						slug={slug ?? ""}
						subtotal={cartTotalCents(cartItems)}
						unitDeliveryFee={Number(unit?.deliveryFee ?? 0)}
						unitId={unitId}
					/>
				</>
			)}

			{step === "payment" && placedOrder && (
				<>
					<SectionHeading
						subtitle={t("store.checkout.payment.subtitle")}
						title={t("store.checkout.payment.title")}
					/>
					<PaymentStep
						amountCents={placedOrder.totalCents}
						customerCpf={activeCustomer?.cpf ?? null}
						onConfirmed={handlePaymentConfirmed}
						orderId={placedOrder.id}
						slug={slug ?? ""}
					/>
				</>
			)}

			<AddressSelectorModal
				addresses={addresses}
				isOpen={addressModalOpen}
				isSaving={isSavingCustomer}
				onClose={() => setAddressModalOpen(false)}
				onCreate={handleAddressSubmit}
				onSelect={address => {
					setSelectedAddressId(address.id);
					setAddressModalOpen(false);
				}}
			/>
		</Container>
	);
}

export const Route = createFileRoute("/_storefront/$unitId/checkout/")({
	component: CheckoutPage,
});
