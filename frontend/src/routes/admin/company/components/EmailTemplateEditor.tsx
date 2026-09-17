import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuBraces, LuChevronDown, LuEye } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { cn } from "@/lib/utils";
import { EmailMessagePreview } from "./EmailMessagePreview";
import type { OrderStatusEmailTemplate } from "./types";

interface EmailTemplateEditorProps {
	companyName: string;
	defaultMessage: string;
	label: string;
	logoUrl: string;
	onChange: (template: OrderStatusEmailTemplate) => void;
	template: OrderStatusEmailTemplate;
}

export function EmailTemplateEditor({
	companyName,
	defaultMessage,
	label,
	logoUrl,
	onChange,
	template,
}: EmailTemplateEditorProps) {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const contentId = useId();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [message, setMessage, flushMessage] = useDebouncedInput(template.message, value => onChange({ message: value }));
	const previewMessage = (message || defaultMessage).replaceAll("{{orderId}}", "#154");

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
		<section className="rounded-brand border border-border bg-muted/20">
			<button
				aria-controls={contentId}
				aria-expanded={isOpen}
				className="flex w-full cursor-pointer items-center gap-3 p-4 text-left transition-colors hover:bg-muted/40"
				onClick={() => setIsOpen(current => !current)}
				type="button"
			>
				<span className="min-w-0 flex-1">
					<span className="block font-semibold text-sm">{label}</span>
					<span className="block truncate text-muted-foreground text-xs">{message || defaultMessage}</span>
				</span>
				<span className="hidden shrink-0 text-muted-foreground text-sm sm:inline">
					{isOpen ? t("actions.minimize") : t("actions.expand")}
				</span>
				<LuChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
			</button>
			{isOpen && (
				<div className="grid gap-4 border-border border-t p-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.72fr)]" id={contentId}>
					<div className="space-y-3">
						<Label className="sr-only" htmlFor={`email-template-${label}`}>{label}</Label>
						<textarea
							className={cn("min-h-32 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm shadow-xs outline-none transition-colors", "placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20")}
							id={`email-template-${label}`}
							maxLength={1000}
							name={`email-template-${label}`}
							onBlur={flushMessage}
							onChange={event => setMessage(event.currentTarget.value)}
							placeholder={t("admin.branding.emailNotificationPlaceholder")}
							ref={textareaRef}
							value={message}
						/>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<Button className="gap-2" onClick={insertOrderId} size="sm" type="button" variant="outline"><LuBraces className="size-4" />{t("admin.branding.insertOrderId")}</Button>
							<span className="text-muted-foreground text-xs">{message.length}/1000</span>
						</div>
					</div>
					<div className="space-y-2">
						<div className="flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide"><LuEye className="size-4" />{t("admin.branding.notificationPreview")}</div>
						<EmailMessagePreview companyName={companyName} logoUrl={logoUrl} message={previewMessage} orderNumber={154} />
					</div>
				</div>
			)}
		</section>
	);
}
