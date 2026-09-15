import { useTranslation } from "react-i18next";
import { LuMessageSquare } from "react-icons/lu";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { defaultOrderStatusTemplates, ORDER_STATUS_TEMPLATE_KEYS, type OrderStatusTemplates } from "./types";
import { WhatsAppTemplateEditor } from "./WhatsAppTemplateEditor";

interface NotificationTemplatesSectionProps {
	onChange: (changes: Partial<OrderStatusTemplates>) => void;
	templates: OrderStatusTemplates;
}

export function NotificationTemplatesSection({ onChange, templates }: NotificationTemplatesSectionProps) {
	const { t } = useTranslation();
	const customized = ORDER_STATUS_TEMPLATE_KEYS.filter(status => {
		const template = templates[status];
		return (
			template.attachments.length > 0 ||
			(template.message.trim() && template.message !== defaultOrderStatusTemplates[status].message)
		);
	}).length;

	return (
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
						key={status}
						label={t(`admin.branding.orderStatus.${status}`)}
						onChange={template => onChange({ [status]: template })}
						template={templates[status]}
					/>
				))}
			</div>
		</CollapsibleSection>
	);
}
