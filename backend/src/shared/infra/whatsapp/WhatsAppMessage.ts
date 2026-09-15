export interface WhatsAppAttachment {
	filename: string;
	mimeType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
	url: string;
}

export interface WhatsAppMessage {
	attachments?: WhatsAppAttachment[];
	text: string;
}
