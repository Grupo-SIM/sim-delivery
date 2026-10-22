import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLiveBranding } from "@/hooks/use-live-branding";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { useGetCustomersMe, usePatchCustomersMeNotificationPreferences } from "@/lib/api";
import { slug } from "@/lib/variant";
import { showToast, useAuthStore } from "@/stores";
import { ThemePreferenceForm } from "./components";

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
	const [savingTheme, setSavingTheme] = useState(false);
	const { allowThemeToggle, defaultTheme, whatsAppEnabled } = useLiveBranding();
	const { mode, saveThemePreference } = useThemePreference(allowThemeToggle, defaultTheme);

	useEffect(() => {
		if (hydrated && !isAuthenticated) void navigate({ search: { redirectTo: "/preferences" }, to: "/identify" });
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
			{ data: { email, whatsApp: whatsAppEnabled ? whatsApp : false } },
			{
				onError: () => setError(t("store.account.preferences.saveError")),
				onSuccess: () => {
					setSaved(true);
					showToast(t("store.account.preferences.saved"), "positive");
				},
			},
		);
	}

	async function handleThemeChange(nextMode: "dark" | "light") {
		setSavingTheme(true);
		try {
			await saveThemePreference(nextMode);
			showToast(t("store.account.preferences.themeSaved"), "positive");
		} catch {
			showToast(t("store.account.preferences.themeSaveError"), "negative");
		} finally {
			setSavingTheme(false);
		}
	}

	return (
		<Container className="max-w-xl space-y-6 py-8">
			<SectionHeading
				subtitle={t("store.account.preferences.subtitle")}
				title={t("store.account.preferences.title")}
			/>
			<div className="space-y-4 rounded-xl border border-border bg-card text-card-foreground p-5">
				<div>
					<h2 className="font-semibold text-lg">{t("store.account.preferences.orderUpdates.title")}</h2>
					<p className="mt-1 text-muted-foreground text-sm">{t("store.account.preferences.orderUpdates.subtitle")}</p>
				</div>
				<div className="space-y-3">
					{/* biome-ignore lint/a11y/noLabelWithoutControl: Checkbox is a custom control nested in the label. */}
					<label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
						<Checkbox checked={email} onChange={event => setEmail(event.currentTarget.checked)} />
						<div>
							<p className="font-medium text-sm">{t("store.account.preferences.email")}</p>
							<p className="text-muted-foreground text-sm">{t("store.account.preferences.emailHint")}</p>
						</div>
					</label>
					{/* biome-ignore lint/a11y/noLabelWithoutControl: Checkbox is a custom control nested in the label. */}
					<label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
						<Checkbox
							checked={whatsAppEnabled && whatsApp}
							disabled={!whatsAppEnabled}
							onChange={event => setWhatsApp(event.currentTarget.checked)}
						/>
						<div>
							<p className="font-medium text-sm">{t("store.account.preferences.whatsApp")}</p>
							<p className="text-muted-foreground text-sm">
								{t(whatsAppEnabled
									? "store.account.preferences.whatsAppHint"
									: "store.account.preferences.whatsAppUnavailable")}
							</p>
						</div>
					</label>
				</div>
				{error && <p className="text-destructive text-sm">{error}</p>}
				{saved && <p className="text-success text-sm">{t("store.account.preferences.saved")}</p>}
				<Button disabled={updatePreferences.isPending} onClick={handleSave} type="button">
					{updatePreferences.isPending
						? t("store.account.preferences.saving")
						: t("store.account.preferences.save")}
				</Button>
			</div>
			{allowThemeToggle && (
				<ThemePreferenceForm isSaving={savingTheme} mode={mode} onChange={handleThemeChange} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/_storefront/preferences/")({ component: PreferencesPage });
