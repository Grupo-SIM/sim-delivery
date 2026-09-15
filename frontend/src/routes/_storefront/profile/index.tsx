import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AddressValue } from "@/components/address";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLiveBranding } from "@/hooks/use-live-branding";
import { useThemePreference } from "@/hooks/use-theme-preference";
import {
	setPassword,
	useDeleteCustomersMeAddressesByAddressId,
	useGetCashbackMe,
	useGetCustomersMe,
	useGetLoyaltyMe,
	usePatchCustomersMe,
	usePatchCustomersMeAddressesByAddressId,
	usePostCustomersMeAddresses,
} from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { slug } from "@/lib/variant";
import { mapSessionUser, showToast, useAuthStore } from "@/stores";
import {
	ProfileAddressSection,
	ProfileDetailsForm,
	ProfileSecurityForm,
	ProfileSkeleton,
	ProfileSummaryCard,
	SavedCardsSection,
	ThemePreferenceForm,
} from "./components";

function profileAddressData(address: AddressValue) {
	return {
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
	};
}

function ProfilePage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const hydrated = useAuthStore(state => state.hydrated);
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const setUser = useAuthStore(state => state.setUser);
	const user = useAuthStore(state => state.user);
	const customerQuery = useGetCustomersMe(
		{ slug: slug ?? "" },
		{ query: { enabled: isAuthenticated && !!slug, retry: false } },
	);
	const cashbackQuery = useGetCashbackMe(
		{ slug: slug ?? "" },
		{ query: { enabled: isAuthenticated && !!slug } },
	);
	const loyaltyQuery = useGetLoyaltyMe(
		{ slug: slug ?? "" },
		{ query: { enabled: isAuthenticated && !!slug } },
	);
	const updateCustomer = usePatchCustomersMe();
	const createAddress = usePostCustomersMeAddresses();
	const updateAddress = usePatchCustomersMeAddressesByAddressId();
	const deleteAddress = useDeleteCustomersMeAddressesByAddressId();
	const [savingDetails, setSavingDetails] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);
	const [savingTheme, setSavingTheme] = useState(false);
	const { allowThemeToggle, defaultTheme } = useLiveBranding();
	const { mode, saveThemePreference } = useThemePreference(allowThemeToggle, defaultTheme);

	useEffect(() => {
		if (hydrated && !isAuthenticated) void navigate({ search: { redirectTo: "/profile" }, to: "/identify" });
	}, [hydrated, isAuthenticated, navigate]);

	if (
		!hydrated ||
		(isAuthenticated && !user) ||
		customerQuery.isPending ||
		cashbackQuery.isPending ||
		loyaltyQuery.isPending
	) {
		return <ProfileSkeleton />;
	}
	if (!user) return null;
	const authenticatedUser = user;

	async function refreshCustomer() {
		await customerQuery.refetch();
	}

	async function handleDetailsSave(value: { cpf: string; email: string; name: string; phone: string }) {
		setSavingDetails(true);
		try {
			const changedName = value.name !== authenticatedUser.name;
			const settingInitialEmail =
				authenticatedUser.email.endsWith("@phone.local") && Boolean(value.email);
			const changedCustomer =
				value.cpf !== (customerQuery.data?.cpf ?? "") ||
				value.phone !== (customerQuery.data?.phone ?? "");
			if (changedName) {
				const { error } = await authClient.updateUser({ name: value.name });
				if (error) throw error;
				const session = await authClient.getSession();
				if (session.data?.user) setUser(mapSessionUser(session.data.user));
			}
			if (settingInitialEmail) {
				const { error } = await authClient.changeEmail({ newEmail: value.email });
				if (error) throw error;
				const session = await authClient.getSession();
				if (session.data?.user) setUser(mapSessionUser(session.data.user));
			}
			if (changedCustomer)
				await updateCustomer.mutateAsync({ data: { cpf: value.cpf, phone: value.phone, slug: slug ?? "" } });
			await refreshCustomer();
			showToast(t("store.account.profile.saved"), "positive");
		} catch {
			showToast(t("store.account.profile.saveError"), "negative");
		} finally {
			setSavingDetails(false);
		}
	}

	async function handlePasswordSave(value: {
		confirmPassword: string;
		currentPassword: string;
		password: string;
	}) {
		if (!value.password || value.password !== value.confirmPassword) {
			showToast(t("store.account.profile.passwordMismatch"), "negative");
			return;
		}
		setSavingPassword(true);
		try {
			const { error } = await setPassword(value.currentPassword || null, value.password);
			if (error) {
				showToast(t(`store.account.profile.passwordErrors.${error}`), "negative");
				return;
			}
			showToast(t("store.account.profile.passwordSaved"), "positive");
		} finally {
			setSavingPassword(false);
		}
	}

	async function handleThemeChange(nextMode: "dark" | "light") {
		setSavingTheme(true);
		try {
			await saveThemePreference(nextMode);
			showToast(t("store.account.profile.themeSaved"), "positive");
		} catch {
			showToast(t("store.account.profile.themeSaveError"), "negative");
		} finally {
			setSavingTheme(false);
		}
	}

	async function handleCreateAddress(address: AddressValue) {
		try {
			await createAddress.mutateAsync({ data: { ...profileAddressData(address), slug: slug ?? "" } });
			await refreshCustomer();
			showToast(t("store.account.profile.addressSaved"), "positive");
		} catch {
			showToast(t("store.account.profile.addressSaveError"), "negative");
		}
	}

	async function handleUpdateAddress(addressId: string, address: AddressValue) {
		try {
			await updateAddress.mutateAsync({ addressId, data: profileAddressData(address) });
			await refreshCustomer();
			showToast(t("store.account.profile.addressSaved"), "positive");
		} catch {
			showToast(t("store.account.profile.addressSaveError"), "negative");
		}
	}

	async function handleSetDefault(addressId: string) {
		try {
			await updateAddress.mutateAsync({ addressId, data: { isDefault: true } });
			await refreshCustomer();
			showToast(t("store.account.profile.defaultAddressSaved"), "positive");
		} catch {
			showToast(t("store.account.profile.addressSaveError"), "negative");
		}
	}

	async function handleDeleteAddress(addressId: string) {
		try {
			await deleteAddress.mutateAsync({ addressId });
			await refreshCustomer();
			showToast(t("store.account.profile.addressDeleted"), "positive");
		} catch {
			showToast(t("store.account.profile.addressDeleteError"), "negative");
		}
	}

	const addressSaving = createAddress.isPending || updateAddress.isPending || deleteAddress.isPending;
	return (
		<Container className="max-w-xl space-y-6 py-8">
			<SectionHeading
				subtitle={t("store.account.profile.subtitle")}
				title={t("store.account.profile.title")}
			/>
			<ProfileSummaryCard
				cashbackBalanceCents={Number(cashbackQuery.data?.balanceCents ?? 0)}
				loyaltyBalancePoints={Number(loyaltyQuery.data?.balancePoints ?? 0)}
				user={user}
			/>
			<ProfileDetailsForm
				customer={customerQuery.data}
				isSaving={savingDetails || updateCustomer.isPending}
				onSave={handleDetailsSave}
				user={user}
			/>
			<ProfileSecurityForm isSaving={savingPassword} onSave={handlePasswordSave} />
			<ProfileAddressSection
				addresses={customerQuery.data?.addresses ?? []}
				isSaving={addressSaving}
				onCreate={handleCreateAddress}
				onDelete={handleDeleteAddress}
				onSetDefault={handleSetDefault}
				onUpdate={handleUpdateAddress}
			/>
			<SavedCardsSection />
			<ThemePreferenceForm
				disabled={!allowThemeToggle}
				isSaving={savingTheme}
				mode={mode}
				onChange={handleThemeChange}
			/>
		</Container>
	);
}

export const Route = createFileRoute("/_storefront/profile/")({
	component: ProfilePage,
});
