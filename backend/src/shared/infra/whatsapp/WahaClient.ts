export interface WahaClientOptions {
	apiKey?: string;
	baseUrl: string;
	session: string;
	timeoutMs?: number;
}

type Fetch = typeof globalThis.fetch;

export class InvalidWhatsAppPhoneError extends Error {
	constructor() {
		super("Invalid Brazilian WhatsApp phone number");
		this.name = "InvalidWhatsAppPhoneError";
	}
}

export function normalizeBrazilianWhatsAppPhone(phone: string): string {
	const digits = phone.replace(/\D/g, "");
	if (!/^55\d{11}$/.test(digits)) throw new InvalidWhatsAppPhoneError();
	return digits;
}

/**
 * WAHA resolves Brazilian WhatsApp contacts through their legacy JID, which
 * omits the mobile ninth digit after the country code and DDD.
 */
export function toWahaBrazilianChatId(phone: string): string {
	const recipient = normalizeBrazilianWhatsAppPhone(phone);
	return `${recipient.slice(0, 4)}${recipient.slice(5)}@c.us`;
}

export function getWahaBrazilianChatIds(phone: string): [string, string] {
	const recipient = normalizeBrazilianWhatsAppPhone(phone);
	return [toWahaBrazilianChatId(recipient), `${recipient}@c.us`];
}

export function getWahaClientOptions(): WahaClientOptions {
	const baseUrl = process.env.WAHA_BASE_URL?.trim();
	if (!baseUrl) throw new Error("WAHA_BASE_URL is required when WAHA is enabled");
	return {
		apiKey: process.env.WAHA_API_KEY?.trim() || undefined,
		baseUrl,
		session: process.env.WAHA_SESSION?.trim() || "default",
	};
}

/** Minimal WAHA text client shared by order notifications and phone OTP. */
export class WahaClient {
	constructor(
		private readonly options: WahaClientOptions,
		private readonly fetchImpl: Fetch = globalThis.fetch,
	) {}

	async sendText(phone: string, message: string): Promise<void> {
		await this.postForBrazilianChatIds(phone, "/api/sendText", chatId => ({
			chatId,
			session: this.options.session,
			text: message,
		}));
	}

	async sendMessage(phone: string, message: WhatsAppMessage): Promise<void> {
		const attachments = message.attachments ?? [];
		if (attachments.length === 0) {
			await this.sendText(phone, message.text);
			return;
		}

		for (const [index, attachment] of attachments.entries()) {
			await this.sendFile(phone, attachment, index === 0 ? message.text : undefined);
		}
	}

	private async sendFile(phone: string, attachment: WhatsAppAttachment, caption?: string): Promise<void> {
		await this.postForBrazilianChatIds(phone, "/api/sendFile", chatId => ({
			...(caption ? { caption } : {}),
			chatId,
			file: {
				filename: attachment.filename,
				mimetype: attachment.mimeType,
				url: attachment.url,
			},
			session: this.options.session,
		}));
	}

	private async postForBrazilianChatIds(
		phone: string,
		path: string,
		body: (chatId: string) => Record<string, unknown>,
	): Promise<void> {
		let response: Response | undefined;
		for (const chatId of getWahaBrazilianChatIds(phone)) {
			response = await this.fetchImpl(`${this.options.baseUrl.replace(/\/$/, "")}${path}`, {
				body: JSON.stringify(body(chatId)),
				headers: {
					...(this.options.apiKey ? { "X-Api-Key": this.options.apiKey } : {}),
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				method: "POST",
				signal: AbortSignal.timeout(this.options.timeoutMs ?? 10_000),
			});

			if (response.ok) return;
		}

		throw new Error(`WAHA request failed (${response?.status})`);
	}
}
import type { WhatsAppAttachment, WhatsAppMessage } from "./WhatsAppMessage";
