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
		const response = await this.fetchImpl(`${this.options.baseUrl.replace(/\/$/, "")}/api/sendText`, {
			body: JSON.stringify({
				chatId: toWahaBrazilianChatId(phone),
				session: this.options.session,
				text: message,
			}),
			headers: {
				...(this.options.apiKey ? { "X-Api-Key": this.options.apiKey } : {}),
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			method: "POST",
			signal: AbortSignal.timeout(this.options.timeoutMs ?? 10_000),
		});

		if (!response.ok) throw new Error(`WAHA request failed (${response.status})`);
	}
}
