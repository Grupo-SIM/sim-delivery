import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetCustomersMe, usePatchCustomersMeNotificationPreferences } from "@/lib/api";
import { slug } from "@/lib/variant";
import { useAuthStore } from "@/stores/auth";

function PreferencesPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const hydrated = useAuthStore(state => state.hydrated);
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const customerQuery = useGetCustomersMe(
		{ slug: slug ?? "" },
		{ query: { enabled: isAuthenticated && !!slug, retry: false } },
	);
	const updatePreferences = usePatchCustomersMeNotificationPreferences();
	const [email, setEmail] = useState(true);
	const [whatsApp, setWhatsApp] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		if (hydrated && !isAuthenticated) void navigate({ to: "/identify" });
	}, [hydrated, isAuthenticated, navigate]);

	useEffect(() => {
		if (!customerQuery.data) return;
		setEmail(customerQuery.data.notificationEmail);
		setWhatsApp(customerQuery.data.notificationWhatsApp);
	}, [customerQuery.data]);

	if (!hydrated || customerQuery.isPending) {
		return (
			<Container className="max-w-xl space-y-6 py-8">
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-48 w-full" />
			</Container>
		);
	}

	function handleSave() {
		setError(null);
		setSaved(false);
		updatePreferences.mutate(
			{ data: { email, whatsApp } },
			{
				onError: () => setError(t("store.account.preferences.saveError")),
				onSuccess: () => setSaved(true),
			},
		);
	}

	return (
		<Container className="max-w-xl space-y-6 py-8">
			<SectionHeading
				subtitle={t("store.account.preferences.subtitle")}
				title={t("store.account.preferences.title")}
			/>
			<div className="space-y-4 rounded-xl border border-border bg-card p-5">
				{/* biome-ignore lint/a11y/noLabelWithoutControl: Checkbox is a custom control nested in the label. */}
				{/* biome-ignore lint/a11y/noLabelWithoutControl: Checkbox is a custom control nested in the label. */}
				{/* biome-ignore lint/a11y/noLabelWithoutControl: Checkbox is a custom control nested in the label. */}
				<label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
					<Checkbox checked={email} onChange={event => setEmail(event.currentTarget.checked)} />
					<span>{t("store.account.preferences.email")}</span>
				</label>
				{/* biome-ignore lint/a11y/noLabelWithoutControl: Checkbox is a custom control nested in the label. */}
				<label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
					<Checkbox checked={whatsApp} onChange={event => setWhatsApp(event.currentTarget.checked)} />
					<span>{t("store.account.preferences.whatsApp")}</span>
				</label>
				{error && <p className="text-destructive text-sm">{error}</p>}
				{saved && <p className="text-primary text-sm">{t("store.account.preferences.saved")}</p>}
				<Button disabled={updatePreferences.isPending} onClick={handleSave} type="button">
					{updatePreferences.isPending
						? t("store.account.preferences.saving")
						: t("store.account.preferences.save")}
				</Button>
			</div>
		</Container>
	);
}

export const Route = createFileRoute("/_storefront/preferences/")({ component: PreferencesPage });
