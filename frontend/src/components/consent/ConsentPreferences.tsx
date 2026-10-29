import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { useModalHistory } from "@/hooks/use-modal-history";
import { showToast } from "@/stores";
import { useConsentStore } from "@/stores/consent";

export function ConsentPreferences() {
	const { t } = useTranslation("common");
	const isOpen = useConsentStore(state => state.preferencesOpen);
	const close = useConsentStore(state => state.closePreferences);
	const closeWithHistory = useModalHistory({ isOpen, onClose: close, urlKey: "cookie-preferences" });
	const [choices, setChoices] = useState(() => ({ analytics: useConsentStore.getState().analytics, marketing: useConsentStore.getState().marketing }));
	return (
		<Modal historyMode="none" isOpen={isOpen} onClose={closeWithHistory} title={t("privacy.preferencesTitle")} urlKey="cookie-preferences">
			<div className="space-y-5">
				<p className="text-muted-foreground text-sm">{t("privacy.preferencesDescription")}</p>
				<label className="flex cursor-not-allowed items-start gap-3 rounded-xl border border-border p-4">
					<Checkbox aria-label={t("privacy.necessary")} checked disabled />
					<span><span className="block font-medium">{t("privacy.necessary")}</span><span className="text-muted-foreground text-sm">{t("privacy.necessaryDescription")}</span></span>
				</label>
				<label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
					<Checkbox checked={choices.analytics} onChange={event => { const checked = event.currentTarget.checked; setChoices(value => ({ ...value, analytics: checked })); }} />
					<span><span className="block font-medium">{t("privacy.analytics")}</span><span className="text-muted-foreground text-sm">{t("privacy.analyticsDescription")}</span></span>
				</label>
				<label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
					<Checkbox checked={choices.marketing} onChange={event => { const checked = event.currentTarget.checked; setChoices(value => ({ ...value, marketing: checked })); }} />
					<span><span className="block font-medium">{t("privacy.marketing")}</span><span className="text-muted-foreground text-sm">{t("privacy.marketingDescription")}</span></span>
				</label>
				<div className="flex flex-wrap justify-end gap-2">
					<Button onClick={closeWithHistory} type="button" variant="outline">{t("privacy.discard")}</Button>
					<Button onClick={() => { useConsentStore.getState().setConsent(choices); showToast(t("privacy.saved"), "positive"); closeWithHistory(); }} type="button">{t("privacy.save")}</Button>
				</div>
			</div>
		</Modal>
	);
}
