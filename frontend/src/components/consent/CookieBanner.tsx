import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { showToast } from "@/stores";
import { useConsentStore } from "@/stores/consent";

export function CookieBanner() {
	const { t } = useTranslation("common");
	const isAdmin = useRouterState({ select: state => state.location.pathname === "/admin" || state.location.pathname.startsWith("/admin/") });
	const decidedAt = useConsentStore(state => state.decidedAt);
	const setConsent = useConsentStore(state => state.setConsent);
	const openPreferences = useConsentStore(state => state.openPreferences);
	const preferencesOpen = useConsentStore(state => state.preferencesOpen);
	if (isAdmin || decidedAt || preferencesOpen) return null;
	const choose = (accepted: boolean) => {
		setConsent({ analytics: accepted, marketing: accepted });
		showToast(t("privacy.saved"), "positive");
	};
	return (
		<aside className="pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex justify-end sm:inset-x-5">
			<section aria-label={t("privacy.cookiesTitle")} className="pointer-events-auto w-full max-w-lg rounded-xl border border-border bg-card p-3 shadow-lg sm:p-4">
				<h2 className="font-display text-base">{t("privacy.cookiesTitle")}</h2>
				<p className="mt-1 text-muted-foreground text-xs leading-relaxed sm:text-sm">{t("privacy.cookiesDescription")} <Link className="cursor-pointer underline underline-offset-4" to="/privacidade">{t("privacy.policyLink")}</Link></p>
				<div className="mt-3 grid grid-cols-3 gap-2">
					<Button onClick={() => choose(true)} size="sm" type="button" variant="outline">{t("privacy.acceptAll")}</Button>
					<Button onClick={() => choose(false)} size="sm" type="button" variant="outline">{t("privacy.reject")}</Button>
					<Button onClick={openPreferences} size="sm" type="button" variant="outline">{t("privacy.customize")}</Button>
				</div>
			</section>
		</aside>
	);
}
