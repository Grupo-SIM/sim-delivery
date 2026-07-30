import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	getCustomersMeQueryOptions,
	getPublicUnitsByUnitSlugMenuQueryOptions,
	getPublicUnitsQueryOptions,
	type PostCustomersMe200,
	useDeleteCustomersMeAddressesByAddressId,
	useGetCashbackMe,
	useGetLoyaltyMe,
	usePostCustomersMe,
	usePostOrders,
} from "@/lib/api";
import { slug } from "@/lib/variant";
import {
	cartTotalCents,
	showAlert,
	useAuthStore,
	useCartStore,
	useCouponStore,
	useDeliveryMethodStore,
} from "@/stores";
import { ProductDetailsModal } from "../components";
import {
	AddressCreateModal,
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
	const [addressCreateModalOpen, setAddressCreateModalOpen] = useState(false);
	const [editingLineKey, setEditingLineKey] = useState<string | null>(null);
	const getMethod = useDeliveryMethodStore(state => state.getMethod);
	const setStoredMethod = useDeliveryMethodStore(state => state.setMethod);
	const getStoredCoupon = useCouponStore(state => state.getCoupon);
	const setStoredCoupon = useCouponStore(state => state.setCoupon);
	const { data: units, isPending: loadingUnits } = useQuery(getPublicUnitsQueryOptions({ slug: slug ?? "" }));
	const unit = units?.find(u => u.slug === unitSlug);
	const unitId = unit?.id ?? "";
	const { data: menu } = useQuery(getPublicUnitsByUnitSlugMenuQueryOptions(unitSlug, { slug: slug ?? "" }));
	const availableMethods = unit?.deliveryMethods ?? ["delivery"];
	const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(() =>
		getMethod(unitId, availableMethods),
	);
	const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => getStoredCoupon(unitId));
	const [cashbackRedeemCents, setCashbackRedeemCents] = useState(0);
	const [loyaltyRedeemPoints, setLoyaltyRedeemPoints] = useState(0);
	const [placedOrder, setPlacedOrder] = useState<{ id: string; totalCents: number } | null>(null);
	const editingItem = cartItems.find(item => item.lineKey === editingLineKey) ?? null;
	const editingMenuItem = editingItem
		? (menu?.flatMap(section => section.items).find(item => item.id === editingItem.id) ?? null)
		: null;

	useEffect(() => {
		setAppliedCoupon(getStoredCoupon(unitId));
	}, [getStoredCoupon, unitId]);

	const { mutate: saveCustomer, isPending: isSavingCustomer } = usePostCustomersMe({
		// Customer response is stored locally after submit. Avoid Kubb's broad
		// "Customers" mutation invalidation causing an unnecessary GET during checkout.
		mutation: { mutationKey: ["checkout-customer"] },
	});
	const { mutate: placeOrder, isPending: isPlacingOrder } = usePostOrders();
	const deleteAddress = useDeleteCustomersMeAddressesByAddressId();

	const { data: existingCustomer, isLoading: loadingCustomer } = useQuery({
		...getCustomersMeQueryOptions({ slug: slug ?? "" }),
		enabled: identified && !!slug,
		// Profile cannot change while this screen is open. Fetch once, then keep its
		// result through component remounts; POST /customers/me returns saved profile.
		gcTime: Number.POSITIVE_INFINITY,
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
		addresses.find(address => address.id === selectedAddressId) ??
		addresses.find(address => address.isDefault) ??
		null;
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

	function handleSetCoupon(coupon: AppliedCoupon | null) {
		setAppliedCoupon(coupon);
		setStoredCoupon(unitId, coupon);
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
					setAddressCreateModalOpen(false);
				},
			},
		);
	}

	function handlePlaceOrder() {
		if (!activeCustomer || !savedAddress || cartItems.length === 0) return;
		placeOrder(
			{
				data: {
					addressId: savedAddress.id,
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
					unitSlug,
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
						onEditItem={item => setEditingLineKey(item.lineKey)}
						onOpenAddressCreator={() => setAddressCreateModalOpen(true)}
						onOpenAddressSelector={() => setAddressModalOpen(true)}
						onSetCoupon={handleSetCoupon}
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
				onClose={() => setAddressModalOpen(false)}
				onCreate={() => {
					setAddressCreateModalOpen(true);
				}}
				onDelete={addressId =>
					deleteAddress.mutate(
						{ addressId },
						{
							onError: () => void showAlert("Não foi possível excluir o endereço."),
							onSuccess: () => {
								setSavedCustomer(current =>
									current
										? { ...current, addresses: current.addresses.filter(address => address.id !== addressId) }
										: current,
								);
								if (selectedAddressId === addressId) setSelectedAddressId(null);
							},
						},
					)
				}
				onSelect={address => {
					setSelectedAddressId(address.id);
					setAddressModalOpen(false);
				}}
			/>
			<AddressCreateModal
				isOpen={addressCreateModalOpen}
				isSaving={isSavingCustomer}
				isSubmodal={addressModalOpen}
				onClose={() => setAddressCreateModalOpen(false)}
				onCreate={handleAddressSubmit}
			/>
			<ProductDetailsModal
				editingItem={editingItem}
				item={editingMenuItem}
				onClose={() => setEditingLineKey(null)}
				unitId={unitId}
			/>
		</Container>
	);
}

export const Route = createFileRoute("/_storefront/$unitId/checkout/")({
	component: CheckoutPage,
});
