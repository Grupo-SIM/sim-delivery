export interface WahaClientOptions {
	apiKey?: string;
	baseUrl: string;
	session: string;
	timeoutMs?: number;
}

export const WAHA_SESSION_STATUSES = [
	"STOPPED",
	"STARTING",
	"SCAN_QR_CODE",
	"PASSKEY_REQUIRED",
	"PASSKEY_CONFIRMATION_REQUIRED",
	"WORKING",
	"FAILED",
] as const;
export type WahaSessionStatus = (typeof WAHA_SESSION_STATUSES)[number];

export interface WahaSessionInfo {
	config?: { metadata?: Record<string, string> };
	me?: { id: string; pushName?: string };
	name: string;
	status: WahaSessionStatus;
}

type Fetch = typeof globalThis.fetch;

export class InvalidWhatsAppPhoneError extends Error {
	constructor() {
		super("Invalid Brazilian WhatsApp phone number");
		this.name = "InvalidWhatsAppPhoneError";
	}
}

export class WahaRequestError extends Error {
	constructor(readonly status: number) {
		super(`WAHA request failed (${status})`);
		this.name = "WahaRequestError";
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

	async createSession(session: string, metadata: Record<string, string>): Promise<WahaSessionInfo> {
		return this.requestJson<WahaSessionInfo>("/api/sessions", {
			body: JSON.stringify({ config: { metadata }, name: session, start: true }),
			method: "POST",
		});
	}

	async startSession(session: string): Promise<WahaSessionInfo> {
		return this.requestJson<WahaSessionInfo>(`/api/sessions/${encodeURIComponent(session)}/start`, {
			method: "POST",
		});
	}

	async getSession(session: string): Promise<WahaSessionInfo> {
		return this.requestJson<WahaSessionInfo>(`/api/sessions/${encodeURIComponent(session)}`);
	}

	async getQrDataUrl(session: string): Promise<string> {
		const response = await this.request(`/api/${encodeURIComponent(session)}/auth/qr?format=image`);
		const mimeType = response.headers.get("content-type")?.split(";")[0] || "image/png";
		const encoded = Buffer.from(await response.arrayBuffer()).toString("base64");
		return `data:${mimeType};base64,${encoded}`;
	}

	async logoutSession(session: string): Promise<WahaSessionInfo> {
		return this.requestJson<WahaSessionInfo>(`/api/sessions/${encodeURIComponent(session)}/logout`, {
			method: "POST",
		});
	}

	async sendText(phone: string, message: string, session = this.options.session): Promise<void> {
		await this.postForBrazilianChatIds(phone, "/api/sendText", chatId => ({
			chatId,
			session,
			text: message,
		}));
	}

	async sendMessage(phone: string, message: WhatsAppMessage, session = this.options.session): Promise<void> {
		const attachments = message.attachments ?? [];
		if (attachments.length === 0) {
			await this.sendText(phone, message.text, session);
			return;
		}

		for (const [index, attachment] of attachments.entries()) {
			await this.sendFile(phone, attachment, index === 0 ? message.text : undefined, session);
		}
	}

	private async sendFile(
		phone: string,
		attachment: WhatsAppAttachment,
		caption: string | undefined,
		session: string,
	): Promise<void> {
		await this.postForBrazilianChatIds(phone, "/api/sendFile", chatId => ({
			...(caption ? { caption } : {}),
			chatId,
			file: {
				filename: attachment.filename,
				mimetype: attachment.mimeType,
				url: attachment.url,
			},
			session,
		}));
	}

	private async request(path: string, init: RequestInit = {}): Promise<Response> {
		const response = await this.fetchImpl(`${this.options.baseUrl.replace(/\/$/, "")}${path}`, {
			...init,
			headers: {
				...(this.options.apiKey ? { "X-Api-Key": this.options.apiKey } : {}),
				Accept: "application/json, image/png",
				...(init.body ? { "Content-Type": "application/json" } : {}),
				...init.headers,
			},
			signal: AbortSignal.timeout(this.options.timeoutMs ?? 10_000),
		});
		if (!response.ok) throw new WahaRequestError(response.status);
		return response;
	}

	private async requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
		return (await this.request(path, init)).json() as Promise<T>;
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

		throw new WahaRequestError(response?.status ?? 0);
	}
}
import type { WhatsAppAttachment, WhatsAppMessage } from "./WhatsAppMessage";
