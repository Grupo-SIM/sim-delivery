import { useTranslation } from "react-i18next";
import { LuPanelBottom } from "react-icons/lu";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { TextField } from "@/components/ui/TextField";
import type { FooterState } from "./types";

interface FooterSectionProps {
	footer: FooterState;
	onChange: (changes: Partial<FooterState>) => void;
	whatsAppEnabled: boolean;
}

export function FooterSection({ footer, onChange, whatsAppEnabled }: FooterSectionProps) {
	const { t } = useTranslation();
	const summary =
		footer.text.trim() ||
		[footer.paymentMethods, footer.whatsApp, footer.supportEmail].map(value => value.trim()).find(Boolean) ||
		t("admin.branding.footerSummaryEmpty");

	return (
		<CollapsibleSection icon={LuPanelBottom} summary={summary} title={t("admin.branding.sectionFooter")}>
			<TextField
				label={t("admin.branding.footerText")}
				onValueChange={text => onChange({ text })}
				placeholder={t("admin.branding.footerTextPlaceholder")}
				value={footer.text}
			/>
			<TextField
				label={t("admin.branding.footerPaymentMethods")}
				onValueChange={paymentMethods => onChange({ paymentMethods })}
				placeholder={t("admin.branding.footerPaymentMethodsPlaceholder")}
				value={footer.paymentMethods}
			/>
			{whatsAppEnabled && <TextField
				label={t("admin.branding.footerWhatsApp")}
				onValueChange={whatsApp => onChange({ whatsApp })}
				placeholder={t("admin.branding.footerWhatsAppPlaceholder")}
				value={footer.whatsApp}
			/>}
			<TextField
				label={t("admin.branding.footerSupportEmail")}
				onValueChange={supportEmail => onChange({ supportEmail })}
				placeholder="contato@minhaloja.com"
				value={footer.supportEmail}
			/>
			<TextField
				label={t("admin.branding.footerInstagramUrl")}
				onValueChange={instagramUrl => onChange({ instagramUrl })}
				placeholder="https://instagram.com/minhaloja"
				value={footer.instagramUrl}
			/>
			<TextField
				label={t("admin.branding.footerFacebookUrl")}
				onValueChange={facebookUrl => onChange({ facebookUrl })}
				placeholder="https://facebook.com/minhaloja"
				value={footer.facebookUrl}
			/>
		</CollapsibleSection>
	);
}
