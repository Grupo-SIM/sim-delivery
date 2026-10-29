import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useGetBranding } from "@/lib/api";
import { slug } from "@/lib/variant";
import { useConsentStore } from "@/stores/consent";

function PrivacyPage() {
	const { t } = useTranslation("common");
	const { data, isPending, isError } = useGetBranding({ slug });
	const openPreferences = useConsentStore(state => state.openPreferences);
	return (
		<article className="mx-auto w-full max-w-3xl space-y-7 px-5 py-10">
			<header className="space-y-3"><h1 className="font-display text-3xl">{t("privacy.policyLink")}</h1><p className="rounded-xl border border-warning/40 bg-muted p-4 text-sm" role="note">{t("privacy.draftWarning")}</p></header>
			<section className="space-y-3">
				<h2 className="font-display text-xl">{t("privacy.identityTitle")}</h2>
				{isPending ? <div aria-label={t("privacy.loading")} className="animate-pulse space-y-3"><div className="h-5 w-2/3 rounded bg-muted" /><div className="h-5 w-full rounded bg-muted" /><div className="h-5 w-3/4 rounded bg-muted" /></div> : isError ? <p role="alert">{t("privacy.loadError")}</p> : <dl className="space-y-2 text-sm">
					<div><dt className="font-medium">{t("privacy.controller")}</dt><dd>{data?.legalName || t("privacy.pending")}</dd></div>
					<div><dt className="font-medium">{t("privacy.cnpj")}</dt><dd>{data?.cnpj || t("privacy.pending")}</dd></div>
					<div><dt className="font-medium">{t("privacy.address")}</dt><dd>{data?.address || t("privacy.pending")}</dd></div>
					<div><dt className="font-medium">{t("privacy.contact")}</dt><dd>{data?.privacyContactEmail || t("privacy.pending")}{data?.privacyContactPhone ? ` · ${data.privacyContactPhone}` : ""}</dd></div>
				</dl>}
				<p className="text-sm">{t("privacy.operator")}</p>
			</section>
			{(["collection", "purposes", "tracking", "sharing", "retention", "security", "rights", "children", "changes"] as const).map(section => <section className="space-y-2" key={section}><h2 className="font-display text-xl">{t(`privacy.sections.${section}.title`)}</h2><p className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">{t(`privacy.sections.${section}.body`)}</p></section>)}
			<Button onClick={openPreferences} type="button" variant="outline">{t("privacy.preferencesTitle")}</Button>
		</article>
	);
}

export const Route = createFileRoute("/_storefront/privacidade/")({ component: PrivacyPage });
