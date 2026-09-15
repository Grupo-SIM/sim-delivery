import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { LuBraces, LuEye } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { cn } from "@/lib/utils";
import type { OrderStatusTemplate } from "./types";
import { WhatsAppTemplateAttachments } from "./WhatsAppTemplateAttachments";

interface WhatsAppTemplateEditorProps {
	label: string;
	onChange: (template: OrderStatusTemplate) => void;
	template: OrderStatusTemplate;
}

export function WhatsAppTemplateEditor({ label, onChange, template }: WhatsAppTemplateEditorProps) {
	const { t } = useTranslation();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [message, setMessage, flushMessage] = useDebouncedInput(template.message, value =>
		onChange({ ...template, message: value }),
	);

	function insertOrderId() {
		const textarea = textareaRef.current;
		const start = textarea?.selectionStart ?? message.length;
		const end = textarea?.selectionEnd ?? start;
		const next = `${message.slice(0, start)}{{orderId}}${message.slice(end)}`;
		setMessage(next);
		requestAnimationFrame(() => {
			textarea?.focus();
			textarea?.setSelectionRange(start + 11, start + 11);
		});
	}

	return (
		<section className="rounded-brand border border-border bg-muted/20 p-4">
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.72fr)]">
				<div className="space-y-3">
					<Label htmlFor={`whatsapp-template-${label}`}>{label}</Label>
					<textarea
						className={cn(
							"min-h-32 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm shadow-xs outline-none transition-colors",
							"placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20",
						)}
						id={`whatsapp-template-${label}`}
						maxLength={1000}
						name={`whatsapp-template-${label}`}
						onBlur={flushMessage}
						onChange={event => setMessage(event.currentTarget.value)}
						placeholder={t("admin.branding.notificationPlaceholder")}
						ref={textareaRef}
						value={message}
					/>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<Button className="gap-2" onClick={insertOrderId} size="sm" type="button" variant="outline">
							<LuBraces className="size-4" />
							{t("admin.branding.insertOrderId")}
						</Button>
						<span className="text-muted-foreground text-xs">{message.length}/1000</span>
					</div>
					<WhatsAppTemplateAttachments
						attachments={template.attachments}
						onChange={attachments => onChange({ ...template, attachments, message })}
					/>
				</div>

				<div className="space-y-2">
					<div className="flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
						<LuEye className="size-4" />
						{t("admin.branding.notificationPreview")}
					</div>
					<div className="rounded-xl bg-[#efeae2] p-3 dark:bg-[#0b141a]">
						<div className="ml-auto max-w-[92%] rounded-lg rounded-tr-sm bg-[#d9fdd3] px-3 py-2 text-[#111b21] text-sm shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">
							<p className="whitespace-pre-wrap break-words">
								{(message || t("admin.branding.notificationDefaultPreview")).replaceAll(
									"{{orderId}}",
									"#154",
								)}
							</p>
							{template.attachments.length > 0 && (
								<p className="mt-2 border-black/10 border-t pt-2 text-xs opacity-70 dark:border-white/10">
									{t("admin.branding.attachmentCount", { count: template.attachments.length })}
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
