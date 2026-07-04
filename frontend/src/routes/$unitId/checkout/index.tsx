import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
	type PostCustomersMe200,
	getCustomersMeQueryOptions,
	getPublicUnitsQueryOptions,
	useGetCashbackMe,
	usePostCustomersMe,
	usePostOrders,
} from "@/lib/api";
import { variantKey } from "@/lib/variant";
import { cartTotalCents, showAlert, useAuthStore, useCartStore } from "@/stores";
import { AddressForm, IdentifyForm, OrderReview, ProfileForm, type AppliedCoupon, type AddressValue, type DeliveryMethod, type ProfileValue } from "./components";

type Step = "identify" | "profile" | "address" | "review";

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
	const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("delivery");
	const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
	const [cashbackRedeemCents, setCashbackRedeemCents] = useState(0);

	const { mutate: saveCustomer, isPending: isSavingCustomer } = usePostCustomersMe();
	const { mutate: placeOrder, isPending: isPlacingOrder } = usePostOrders();

	const { data: existingCustomer, isLoading: loadingCustomer } = useQuery({
		...getCustomersMeQueryOptions({ variantKey: variantKey ?? "" }),
		enabled: identified && !!variantKey,
	});

	const { data: units } = useQuery(getPublicUnitsQueryOptions({ variantKey: variantKey ?? "" }));
	const unit = units?.find(u => u.id === unitId);

	const { data: cashbackData } = useGetCashbackMe(
		{ variantKey: variantKey ?? "" },
		{ query: { enabled: identified && !!variantKey } },
	);
	const cashbackBalanceCents = cashbackData?.balanceCents ?? 0;

	const step: Step = !identified
		? "identify"
		: identified && loadingCustomer
			? "identify"
			: existingCustomer === null && profileValue === null && savedCustomer === null
				? "profile"
				: savedCustomer === null && existingCustomer === null
					? "address"
					: savedCustomer !== null || existingCustomer !== null
						? savedCustomer === null && existingCustomer !== null
							? "address"
							: "review"
						: "address";

	const activeCustomer = savedCustomer ?? existingCustomer ?? null;
	const savedAddress = activeCustomer?.addresses[0] ?? null;

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
					redeemCashbackCents: cashbackRedeemCents > 0 ? cashbackRedeemCents : undefined,
					items: cartItems.map(item => ({
						note: item.note || undefined,
						quantity: item.quantity,
						unitProductId: item.id,
					})),
					unitId,
					variantKey: variantKey ?? "",
				},
			},
			{
				onError: () => void showAlert(t("store.checkout.order.error")),
				onSuccess: () => {
					clearCart();
					void showAlert(t("store.checkout.order.success")).then(() => {
						void navigate({ params: { unitId }, to: "/$unitId" });
					});
				},
			},
		);
	}

	return (
		<Container className="max-w-lg space-y-6 py-8">
			<Link className="text-primary text-sm" params={{ unitId }} to="/$unitId">
				← {t("store.checkout.back")}
			</Link>

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
						cashbackBalanceCents={cashbackBalanceCents}
						cashbackRedeemCents={cashbackRedeemCents}
						deliveryMethod={deliveryMethod}
						isPending={isPlacingOrder}
						items={cartItems}
						onChangeCashbackRedeem={setCashbackRedeemCents}
						onChangeDeliveryMethod={setDeliveryMethod}
						onSetCoupon={setAppliedCoupon}
						onSubmit={handlePlaceOrder}
						subtotal={cartTotalCents(cartItems)}
						unitDeliveryFee={unit?.deliveryFee ?? 0}
						unitId={unitId}
						variantKey={variantKey ?? ""}
					/>
				</>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/$unitId/checkout/")({
	component: CheckoutPage,
});
