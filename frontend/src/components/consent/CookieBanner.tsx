import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { showToast } from "@/stores";
import { useConsentStore } from "@/stores/consent";

export function CookieBanner() {
	const { t } = useTranslation("common");
	const decidedAt = useConsentStore(state => state.decidedAt);
	const setConsent = useConsentStore(state => state.setConsent);
	const openPreferences = useConsentStore(state => state.openPreferences);
	const preferencesOpen = useConsentStore(state => state.preferencesOpen);
	if (decidedAt || preferencesOpen) return null;
	const choose = (accepted: boolean) => {
		setConsent({ analytics: accepted, marketing: accepted });
		showToast(t("privacy.saved"), "positive");
	};
	return (
		<section aria-label={t("privacy.cookiesTitle")} className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-4xl rounded-2xl border border-border bg-card p-5 shadow-xl sm:inset-x-6 sm:p-6">
			<h2 className="font-display text-lg">{t("privacy.cookiesTitle")}</h2>
			<p className="mt-2 text-muted-foreground text-sm">{t("privacy.cookiesDescription")} <Link className="cursor-pointer underline underline-offset-4" to="/privacidade">{t("privacy.policyLink")}</Link></p>
			<div className="mt-4 grid gap-2 sm:grid-cols-3">
				<Button onClick={() => choose(true)} type="button" variant="outline">{t("privacy.acceptAll")}</Button>
				<Button onClick={() => choose(false)} type="button" variant="outline">{t("privacy.reject")}</Button>
				<Button onClick={openPreferences} type="button" variant="outline">{t("privacy.customize")}</Button>
			</div>
		</section>
	);
}
