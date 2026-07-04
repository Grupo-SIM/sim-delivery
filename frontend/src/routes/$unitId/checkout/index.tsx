import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
	getCustomersMeQueryOptions,
	usePostCustomersMe,
} from "@/lib/api";
import { variantKey } from "@/lib/variant";
import { showAlert, useAuthStore } from "@/stores";
import { useQuery } from "@tanstack/react-query";
import { AddressForm, IdentifyForm, ProfileForm, type AddressValue, type ProfileValue } from "./components";

type Step = "identify" | "profile" | "address";

function CheckoutPage() {
	const { t } = useTranslation();
	const { unitId } = Route.useParams();
	const { isAuthenticated: identified, user } = useAuthStore(state => ({ isAuthenticated: state.isAuthenticated, user: state.user }));
	const [profileValue, setProfileValue] = useState<ProfileValue | null>(null);
	const { mutate: saveCustomer, isPending } = usePostCustomersMe();

	const { data: existingCustomer, isLoading: loadingCustomer } = useQuery({
		...getCustomersMeQueryOptions({ variantKey: variantKey ?? "" }),
		enabled: identified && !!variantKey,
	});

	const step: Step = !identified
		? "identify"
		: existingCustomer === undefined && loadingCustomer
			? "identify"
			: existingCustomer === null && profileValue === null
				? "profile"
				: "address";

	function handleAddressSubmit(address: AddressValue) {
		const profile = profileValue ?? {
			cpf: existingCustomer?.cpf ?? "",
			name: user?.name ?? "",
		};
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
				onSuccess: () => void showAlert(t("store.checkout.address.saved")),
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
					<AddressForm
						disabled={isPending}
						onSubmit={handleAddressSubmit}
					/>
				</>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/$unitId/checkout/")({
	component: CheckoutPage,
});
