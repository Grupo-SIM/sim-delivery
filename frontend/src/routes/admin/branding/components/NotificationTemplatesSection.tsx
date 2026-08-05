import { useTranslation } from "react-i18next";
import { LuMessageSquare } from "react-icons/lu";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { TextField } from "@/components/ui/TextField";
import { defaultOrderStatusTemplates, ORDER_STATUS_TEMPLATE_KEYS, type OrderStatusTemplates } from "./types";

interface NotificationTemplatesSectionProps {
	onChange: (changes: Partial<OrderStatusTemplates>) => void;
	templates: OrderStatusTemplates;
}

export function NotificationTemplatesSection({ onChange, templates }: NotificationTemplatesSectionProps) {
	const { t } = useTranslation();
	const customized = ORDER_STATUS_TEMPLATE_KEYS.filter(
		status => templates[status].trim() && templates[status] !== defaultOrderStatusTemplates[status],
	).length;

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
			<p className="text-muted-foreground text-sm">{t("admin.branding.notificationsHelp")}</p>
			{ORDER_STATUS_TEMPLATE_KEYS.map(status => (
				<TextField
					key={status}
					label={t(`admin.branding.orderStatus.${status}`)}
					onValueChange={value => onChange({ [status]: value })}
					placeholder={t("admin.branding.notificationPlaceholder")}
					value={templates[status]}
				/>
			))}
		</CollapsibleSection>
	);
}
