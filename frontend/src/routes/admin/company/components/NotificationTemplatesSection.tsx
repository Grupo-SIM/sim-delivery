import { useTranslation } from "react-i18next";
import { LuMail, LuMessageSquare } from "react-icons/lu";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import {
	defaultOrderStatusTemplates,
	ORDER_STATUS_TEMPLATE_KEYS,
	type OrderStatusEmailTemplates,
	type OrderStatusTemplates,
} from "./types";
import { EmailTemplateEditor } from "./EmailTemplateEditor";
import { WhatsAppTemplateEditor } from "./WhatsAppTemplateEditor";

interface NotificationTemplatesSectionProps {
	companyName: string;
	emailTemplates: OrderStatusEmailTemplates;
	logoUrl: string;
	onEmailChange: (changes: Partial<OrderStatusEmailTemplates>) => void;
	onChange: (changes: Partial<OrderStatusTemplates>) => void;
	templates: OrderStatusTemplates;
}

export function NotificationTemplatesSection({
	companyName,
	emailTemplates,
	logoUrl,
	onChange,
	onEmailChange,
	templates,
}: NotificationTemplatesSectionProps) {
	const { t } = useTranslation();
	const customized = ORDER_STATUS_TEMPLATE_KEYS.filter(status => {
		const template = templates[status];
		return (
			template.attachments.length > 0 ||
			(template.message.trim() && template.message !== defaultOrderStatusTemplates[status].message)
		);
	}).length;
	const emailCustomized = ORDER_STATUS_TEMPLATE_KEYS.filter(status => emailTemplates[status].message.trim()).length;

	return <>
		<CollapsibleSection
			icon={LuMessageSquare}
			summary={
				customized
					? t("admin.branding.notificationsSummary", { count: customized })
					: t("admin.branding.notificationsSummaryEmpty")
			}
			title={t("admin.branding.sectionNotifications")}
		>
			<div className="space-y-1">
				<p className="text-muted-foreground text-sm">{t("admin.branding.notificationsHelp")}</p>
				<p className="text-muted-foreground text-xs">{t("admin.branding.notificationsFormattingHelp")}</p>
			</div>
			<div className="grid gap-4">
				{ORDER_STATUS_TEMPLATE_KEYS.map(status => (
					<WhatsAppTemplateEditor
						allowReasonSlot={status === "cancelado"}
						key={status}
						label={t(`admin.branding.orderStatus.${status}`)}
						onChange={template => onChange({ [status]: template })}
						template={templates[status]}
					/>
				))}
			</div>
		</CollapsibleSection>
		<CollapsibleSection
			icon={LuMail}
			summary={t("admin.branding.emailNotificationsSummary", { count: emailCustomized })}
			title={t("admin.branding.sectionEmailNotifications")}
		>
			<p className="text-muted-foreground text-sm">{t("admin.branding.emailNotificationsHelp")}</p>
			<div className="grid gap-4">
				{ORDER_STATUS_TEMPLATE_KEYS.map(status => (
					<EmailTemplateEditor
						companyName={companyName}
						defaultMessage={defaultOrderStatusTemplates[status].message}
						key={status}
						label={t(`admin.branding.orderStatus.${status}`)}
						logoUrl={logoUrl}
						onChange={template => onEmailChange({ [status]: template })}
						template={emailTemplates[status]}
					/>
				))}
			</div>
		</CollapsibleSection>
	</>;
}
