import { useTranslation } from "react-i18next";
import { LuShieldCheck } from "react-icons/lu";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Label } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { TextField } from "@/components/ui/TextField";

interface PrivacySectionProps {
	cnpj: string | null | undefined;
	legalName: string;
	address: string;
	privacyContactEmail: string;
	privacyContactPhone: string;
	onLegalNameChange: (value: string) => void;
	onAddressChange: (value: string) => void;
	onPrivacyContactEmailChange: (value: string) => void;
	onPrivacyContactPhoneChange: (value: string) => void;
}

export function PrivacySection({ cnpj, legalName, address, privacyContactEmail, privacyContactPhone, onLegalNameChange, onAddressChange, onPrivacyContactEmailChange, onPrivacyContactPhoneChange }: PrivacySectionProps) {
	const { t } = useTranslation();
	return (
		<CollapsibleSection icon={LuShieldCheck} summary={!cnpj?.trim() ? t("admin.branding.missingCnpjWarning") : legalName.trim() || t("admin.branding.privacySummaryEmpty")} title={t("admin.branding.sectionPrivacy")}>
			<TextField autoComplete="organization" label={t("admin.branding.legalName")} maxLength={500} name="legalName" onValueChange={onLegalNameChange} placeholder={t("admin.branding.legalNamePlaceholder")} value={legalName} />
			<TextField autoComplete="street-address" label={t("admin.branding.privacyAddress")} maxLength={500} name="companyAddress" onValueChange={onAddressChange} placeholder={t("admin.branding.privacyAddressPlaceholder")} value={address} />
			<TextField autoComplete="email" inputMode="email" label={t("admin.branding.privacyContactEmail")} maxLength={500} name="privacyContactEmail" onValueChange={onPrivacyContactEmailChange} placeholder={t("admin.branding.privacyContactEmailPlaceholder")} value={privacyContactEmail} />
			<Label>
				{t("admin.branding.privacyContactPhone")}
				<MaskedInput autoComplete="tel-national" format={privacyContactPhone.replace(/\D/g, "").length > 10 ? "(##) #####-####" : "(##) ####-#####"} inputMode="tel" name="privacyContactPhone" onValueChange={({ value }) => onPrivacyContactPhoneChange(value)} placeholder={t("admin.branding.privacyContactPhonePlaceholder")} type="tel" value={privacyContactPhone} valueIsNumericString />
			</Label>
			{!cnpj?.trim() && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="status">{t("admin.branding.missingCnpjWarning")}</p>}
		</CollapsibleSection>
	);
}
