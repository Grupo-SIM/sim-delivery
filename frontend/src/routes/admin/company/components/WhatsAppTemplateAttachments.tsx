import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuFileText, LuImage, LuLoaderCircle, LuPaperclip, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { uploadMedia } from "@/lib/api";
import { showToast } from "@/stores";
import type { WhatsAppTemplateAttachment } from "./types";

const MAX_ATTACHMENTS = 3;

interface WhatsAppTemplateAttachmentsProps {
	attachments: WhatsAppTemplateAttachment[];
	onChange: (attachments: WhatsAppTemplateAttachment[]) => void;
}

export function WhatsAppTemplateAttachments({
	attachments,
	onChange,
}: WhatsAppTemplateAttachmentsProps) {
	const { t } = useTranslation();
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);

	async function upload(files: FileList) {
		const available = MAX_ATTACHMENTS - attachments.length;
		const selected = Array.from(files).slice(0, available);
		if (selected.length === 0) return;
		setUploading(true);
		try {
			const uploaded = await Promise.all(
				selected.map(async file => ({
					filename: file.name,
					mimeType: file.type as WhatsAppTemplateAttachment["mimeType"],
					url: await uploadMedia("whatsapp", file),
				})),
			);
			onChange([...attachments, ...uploaded]);
			showToast(t("admin.branding.attachmentsUploaded"), "positive");
		} catch {
			showToast(t("admin.branding.uploadError"), "negative");
		} finally {
			setUploading(false);
		}
	}

	return (
		<div className="space-y-2 border-border border-t pt-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<p className="font-semibold text-sm">{t("admin.branding.attachments")}</p>
					<p className="text-muted-foreground text-xs">{t("admin.branding.attachmentsHelp")}</p>
					<p className="text-muted-foreground text-xs">{t("media.anyDimensions")}</p>
				</div>
				<Button
					className="gap-2"
					disabled={uploading || attachments.length >= MAX_ATTACHMENTS}
					onClick={() => inputRef.current?.click()}
					size="sm"
					type="button"
					variant="outline"
				>
					{uploading ? <LuLoaderCircle className="size-4 animate-spin" /> : <LuPaperclip className="size-4" />}
					{t("admin.branding.addAttachment")}
				</Button>
				<input
					accept="image/jpeg,image/png,image/webp,application/pdf"
					className="hidden"
					multiple
					onChange={event => {
						if (event.currentTarget.files) void upload(event.currentTarget.files);
						event.currentTarget.value = "";
					}}
					ref={inputRef}
					type="file"
				/>
			</div>
			{attachments.map((attachment, index) => (
				<div className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2" key={attachment.url}>
					{attachment.mimeType === "application/pdf" ? (
						<LuFileText className="size-5 shrink-0 text-destructive" />
					) : (
						<LuImage className="size-5 shrink-0 text-primary" />
					)}
					<span className="min-w-0 flex-1 truncate text-sm">{attachment.filename}</span>
					<Button
						aria-label={t("admin.branding.removeAttachment", { filename: attachment.filename })}
						onClick={() => {
							onChange(attachments.filter((_, itemIndex) => itemIndex !== index));
							showToast(t("admin.branding.attachmentRemoved"), "info");
						}}
						size="icon"
						type="button"
						variant="outline"
					>
						<LuTrash2 className="size-4" />
					</Button>
				</div>
			))}
		</div>
	);
}
