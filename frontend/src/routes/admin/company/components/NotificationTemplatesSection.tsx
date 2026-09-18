import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuBell } from "react-icons/lu";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import {
	ORDER_STATUS_TEMPLATE_KEYS,
	type OrderStatusEmailTemplates,
	type OrderStatusTemplateKey,
	type OrderStatusTemplates,
} from "./types";
import { NotificationTemplateModal } from "./NotificationTemplateModal";
import { NotificationTemplateRow } from "./NotificationTemplateRow";

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
	const [selectedStatus, setSelectedStatus] = useState<OrderStatusTemplateKey | null>(null);

	return <>
		<CollapsibleSection
			icon={LuBell}
			summary={t("admin.branding.notificationsSummary")}
			title={t("admin.branding.sectionNotifications")}
		>
			<p className="text-muted-foreground text-sm">{t("admin.branding.notificationsHelp")}</p>
			<ul className="grid gap-3">
				{ORDER_STATUS_TEMPLATE_KEYS.map(status => (
					<NotificationTemplateRow
						key={status}
						label={t(`admin.branding.orderStatus.${status}`)}
						onEdit={() => setSelectedStatus(status)}
					/>
				))}
			</ul>
		</CollapsibleSection>
		{selectedStatus && (
			<NotificationTemplateModal
				allowReasonSlot={selectedStatus === "cancelado"}
				companyName={companyName}
				emailTemplate={emailTemplates[selectedStatus]}
				key={selectedStatus}
				label={t(`admin.branding.orderStatus.${selectedStatus}`)}
				logoUrl={logoUrl}
				onClose={() => setSelectedStatus(null)}
				onSave={(emailTemplate, whatsAppTemplate) => {
					onChange({ [selectedStatus]: whatsAppTemplate });
					onEmailChange({ [selectedStatus]: emailTemplate });
				}}
				status={selectedStatus}
				whatsAppTemplate={templates[selectedStatus]}
			/>
		)}
	</>;
}
