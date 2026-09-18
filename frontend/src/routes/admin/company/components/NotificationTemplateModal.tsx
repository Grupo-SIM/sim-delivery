import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuBraces, LuEye, LuMail, LuMessageSquare } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/Modal";
import { closeActiveModalHistory } from "@/hooks/use-modal-history";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { cn } from "@/lib/utils";
import { showToast } from "@/stores";
import { EmailMessagePreview } from "./EmailMessagePreview";
import type {
	OrderStatusEmailTemplate,
	OrderStatusTemplate,
	OrderStatusTemplateKey,
	WhatsAppTemplateAttachment,
} from "./types";
import { WhatsAppMessagePreview } from "./WhatsAppMessagePreview";
import { WhatsAppTemplateAttachments } from "./WhatsAppTemplateAttachments";

type NotificationChannel = "email" | "whatsApp";

interface NotificationTemplateModalProps {
	allowReasonSlot: boolean;
	companyName: string;
	emailTemplate: OrderStatusEmailTemplate;
	label: string;
	logoUrl: string;
	onClose: () => void;
	onSave: (emailTemplate: OrderStatusEmailTemplate, whatsAppTemplate: OrderStatusTemplate) => void;
	status: OrderStatusTemplateKey;
	whatsAppTemplate: OrderStatusTemplate;
}

export function NotificationTemplateModal({
	allowReasonSlot,
	companyName,
	emailTemplate,
	label,
	logoUrl,
	onClose,
	onSave,
	status,
	whatsAppTemplate,
}: NotificationTemplateModalProps) {
	const { t } = useTranslation();
	const [channel, setChannel] = useState<NotificationChannel>("whatsApp");
	const [attachments, setAttachments] = useState<WhatsAppTemplateAttachment[]>(whatsAppTemplate.attachments);
	const whatsAppTextareaRef = useRef<HTMLTextAreaElement>(null);
	const [whatsAppMessage, setWhatsAppMessage, flushWhatsAppMessage] = useDebouncedInput(whatsAppTemplate.message, () => undefined);
	const [emailMessage, setEmailMessage, flushEmailMessage] = useDebouncedInput(emailTemplate.message, () => undefined);
	const [emailSubtitle, setEmailSubtitle, flushEmailSubtitle] = useDebouncedInput(emailTemplate.subtitle, () => undefined);
	const [emailTitle, setEmailTitle, flushEmailTitle] = useDebouncedInput(emailTemplate.title, () => undefined);
	const previewWhatsAppMessage = whatsAppMessage
		.replaceAll("{{orderId}}", "#154")
		.replaceAll("{{reason}}", allowReasonSlot ? t("admin.branding.cancelReasonPreview") : "");
	const previewEmailMessage = emailMessage
		.replaceAll("{{orderId}}", "#154")
		.replaceAll("{{reason}}", allowReasonSlot ? t("admin.branding.cancelReasonPreview") : "");
	const previewEmailSubtitle = emailSubtitle.replaceAll("{{orderId}}", "#154");
	const previewEmailTitle = emailTitle.replaceAll("{{orderId}}", "#154");

	function insertWhatsAppSlot(slot: "{{orderId}}" | "{{reason}}") {
		const textarea = whatsAppTextareaRef.current;
		const start = textarea?.selectionStart ?? whatsAppMessage.length;
		const end = textarea?.selectionEnd ?? start;
		setWhatsAppMessage(`${whatsAppMessage.slice(0, start)}${slot}${whatsAppMessage.slice(end)}`);
		requestAnimationFrame(() => {
			textarea?.focus();
			textarea?.setSelectionRange(start + slot.length, start + slot.length);
		});
	}

	function save() {
		flushWhatsAppMessage();
		flushEmailMessage();
		flushEmailSubtitle();
		flushEmailTitle();
		onSave(
			{ message: emailMessage, subtitle: emailSubtitle, title: emailTitle },
			{ attachments, message: whatsAppMessage },
		);
		showToast(t("admin.branding.notificationSaved"), "positive");
		closeActiveModalHistory();
	}

	return (
		<Modal isOpen maxWidth="1080px" onClose={onClose} title={label} urlKey="order-notification" urlState={status}>
			<div className="space-y-5">
				<p className="text-muted-foreground text-sm">{t("admin.branding.notificationModalHelp")}</p>
				<div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-1" role="tablist">
					<Button
						aria-selected={channel === "whatsApp"}
						className={cn("justify-center", channel === "whatsApp" && "border-success bg-success text-background hover:bg-success/90")}
						onClick={() => setChannel("whatsApp")}
						role="tab"
						type="button"
						variant="outline"
					>
						<LuMessageSquare className="size-4" />
						{t("admin.branding.notificationWhatsApp")}
					</Button>
					<Button
						aria-selected={channel === "email"}
						className={cn("justify-center", channel === "email" && "border-primary bg-primary text-primary-foreground hover:bg-primary/90")}
						onClick={() => setChannel("email")}
						role="tab"
						type="button"
						variant="outline"
					>
						<LuMail className="size-4" />
						{t("admin.branding.notificationEmail")}
					</Button>
				</div>

				{channel === "whatsApp" ? (
					<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
						<div className="space-y-3">
							<div>
								<Label htmlFor="notification-whatsapp-message">{t("admin.branding.notificationMessage")}</Label>
								<p className="mt-1 text-muted-foreground text-xs">{t("admin.branding.notificationWhatsAppHelp")}</p>
							</div>
							<textarea
								className="min-h-40 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
								id="notification-whatsapp-message"
								maxLength={1000}
								name="notification-whatsapp-message"
								onBlur={flushWhatsAppMessage}
								onChange={event => setWhatsAppMessage(event.currentTarget.value)}
								placeholder={t("admin.branding.notificationPlaceholder")}
								ref={whatsAppTextareaRef}
								value={whatsAppMessage}
							/>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div className="flex flex-wrap gap-2">
									<Button onClick={() => insertWhatsAppSlot("{{orderId}}") } size="sm" type="button" variant="outline">
										<LuBraces className="size-4" />
										{t("admin.branding.insertOrderId")}
									</Button>
									{allowReasonSlot && (
										<Button onClick={() => insertWhatsAppSlot("{{reason}}") } size="sm" type="button" variant="outline">
											<LuBraces className="size-4" />
											{t("admin.branding.insertCancelReason")}
										</Button>
									)}
								</div>
								<span className="text-muted-foreground text-xs">{whatsAppMessage.length}/1000</span>
							</div>
							<WhatsAppTemplateAttachments attachments={attachments} onChange={setAttachments} />
						</div>
						<div className="space-y-2">
							<div className="flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
								<LuEye className="size-4" />
								{t("admin.branding.notificationPreview")}
							</div>
							<div className="rounded-xl bg-[#efeae2] p-3 dark:bg-[#0b141a]">
								<div className="ml-auto max-w-[92%] rounded-lg rounded-tr-sm bg-[#d9fdd3] px-3 py-2 text-[#111b21] text-sm shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">
									<WhatsAppMessagePreview message={previewWhatsAppMessage} />
									{attachments.length > 0 && <p className="mt-2 border-black/10 border-t pt-2 text-xs opacity-70 dark:border-white/10">{t("admin.branding.attachmentCount", { count: attachments.length })}</p>}
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
						<div className="space-y-3">
							<p className="text-muted-foreground text-sm">{t("admin.branding.notificationEmailHelp")}</p>
							<Label htmlFor="notification-email-title">{t("admin.branding.emailTitle")}</Label>
							<input className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20" id="notification-email-title" maxLength={200} name="notification-email-title" onBlur={flushEmailTitle} onChange={event => setEmailTitle(event.currentTarget.value)} placeholder="Ex: Atualização do pedido {{orderId}}" value={emailTitle} />
							<Label htmlFor="notification-email-subtitle">{t("admin.branding.emailSubtitle")}</Label>
							<input className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20" id="notification-email-subtitle" maxLength={200} name="notification-email-subtitle" onBlur={flushEmailSubtitle} onChange={event => setEmailSubtitle(event.currentTarget.value)} placeholder="Ex: Acompanhe seu pedido" value={emailSubtitle} />
							<Label htmlFor="notification-email-message">{t("admin.branding.emailText")}</Label>
							<textarea className="min-h-40 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20" id="notification-email-message" maxLength={1000} name="notification-email-message" onBlur={flushEmailMessage} onChange={event => setEmailMessage(event.currentTarget.value)} placeholder={t("admin.branding.emailNotificationPlaceholder")} value={emailMessage} />
							<div className="flex items-center justify-between gap-2">
								<span className="text-muted-foreground text-xs">{t("admin.branding.emailFormattingHelp")}</span>
								<span className="shrink-0 text-muted-foreground text-xs">{emailMessage.length}/1000</span>
							</div>
						</div>
						<div className="space-y-2">
							<div className="flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
								<LuEye className="size-4" />
								{t("admin.branding.notificationPreview")}
							</div>
							<EmailMessagePreview companyName={companyName} logoUrl={logoUrl} message={previewEmailMessage} subtitle={previewEmailSubtitle} title={previewEmailTitle} />
						</div>
					</div>
				)}

				<div className="flex justify-end gap-2 border-border border-t pt-4">
					<Button onClick={() => closeActiveModalHistory()} type="button" variant="outline">
						{t("actions.discard")}
					</Button>
					<Button onClick={save} type="button">{t("actions.save")}</Button>
				</div>
			</div>
		</Modal>
	);
}
