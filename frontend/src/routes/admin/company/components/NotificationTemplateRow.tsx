import { useTranslation } from "react-i18next";
import { LuMail, LuMessageSquare, LuPencil } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotificationTemplateRowProps {
	label: string;
	onEdit: () => void;
}

export function NotificationTemplateRow({ label, onEdit }: NotificationTemplateRowProps) {
	const { t } = useTranslation();

	return (
		<li className="flex flex-col gap-3 rounded-brand border border-border bg-muted/20 p-4 transition-colors hover:border-primary/30 hover:bg-muted/35 sm:flex-row sm:items-center">
			<div className="min-w-0 flex-1">
				<h3 className="font-semibold text-sm">{label}</h3>
				<p className="mt-0.5 text-muted-foreground text-sm">{t("admin.branding.notificationsRowHelp")}</p>
			</div>
			<div className="flex flex-wrap gap-2" aria-label={t("admin.branding.notificationChannels")}>
				<Badge className="gap-1.5 normal-case tracking-normal" tone="success">
					<LuMessageSquare className="size-3.5" />
					{t("admin.branding.notificationWhatsApp")}
				</Badge>
				<Badge className="gap-1.5 normal-case tracking-normal" tone="primary">
					<LuMail className="size-3.5" />
					{t("admin.branding.notificationEmail")}
				</Badge>
			</div>
			<Button className="shrink-0" onClick={onEdit} type="button" variant="outline">
				<LuPencil className="size-4" />
				{t("admin.branding.notificationEdit")}
			</Button>
		</li>
	);
}
