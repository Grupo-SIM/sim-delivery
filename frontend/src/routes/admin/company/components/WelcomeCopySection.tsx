import { useTranslation } from "react-i18next";
import { LuText } from "react-icons/lu";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { TextField } from "@/components/ui/TextField";

interface WelcomeCopySectionProps {
	eyebrow: string;
	description: string;
	onEyebrowChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
}

export function WelcomeCopySection({ eyebrow, description, onEyebrowChange, onDescriptionChange }: WelcomeCopySectionProps) {
	const { t } = useTranslation();
	return (
		<CollapsibleSection icon={LuText} summary={eyebrow || t("store.welcome.eyebrow")} title={t("admin.branding.sectionWelcome")}>
			<TextField label={t("admin.branding.welcomeEyebrow")} placeholder={t("store.welcome.eyebrow")} value={eyebrow} onValueChange={onEyebrowChange} maxLength={100} />
			<TextField label={t("admin.branding.welcomeDescription")} placeholder={t("store.welcome.description")} value={description} onValueChange={onDescriptionChange} maxLength={500} />
		</CollapsibleSection>
	);
}
