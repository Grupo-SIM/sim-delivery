import { WhatsAppProvider } from "../WhatsAppProvider";

interface WahaWhatsAppProviderOptions {
	apiKey?: string;
	baseUrl: string;
	session: string;
}

type Fetch = typeof globalThis.fetch;

/** WAHA provider. Requires a running WAHA instance and an authenticated session. */
export class WahaWhatsAppProvider extends WhatsAppProvider {
	constructor(
		private readonly options: WahaWhatsAppProviderOptions,
		private readonly fetchImpl: Fetch = globalThis.fetch,
	) {
		super();
	}

	async sendOrderStatus(phone: string, _status: string, _orderId: string, message?: string): Promise<void> {
		const response = await this.fetchImpl(`${this.options.baseUrl.replace(/\/$/, "")}/api/sendText`, {
			body: JSON.stringify({
				chatId: `${phone.replace(/\D/g, "")}@c.us`,
				session: this.options.session,
				text: message ?? "Atualização do pedido.",
			}),
			headers: {
				...(this.options.apiKey ? { "X-Api-Key": this.options.apiKey } : {}),
				"Content-Type": "application/json",
			},
			method: "POST",
		});

		if (!response.ok) throw new Error(`WAHA request failed (${response.status}): ${await response.text()}`);
	}
}
