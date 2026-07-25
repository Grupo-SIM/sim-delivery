import { WhatsAppProvider } from "../WhatsAppProvider";

interface MetaWhatsAppProviderOptions {
	accessToken: string;
	apiVersion?: string;
	phoneNumberId: string;
	templateLanguage?: string;
	templateName?: string;
}

type Fetch = typeof globalThis.fetch;

/** WhatsApp Cloud API provider. Free-form text is valid only in Meta's 24-hour customer-service window. */
export class MetaWhatsAppProvider extends WhatsAppProvider {
	private readonly endpoint: string;

	constructor(
		private readonly options: MetaWhatsAppProviderOptions,
		private readonly fetchImpl: Fetch = globalThis.fetch,
	) {
		super();
		this.endpoint = `https://graph.facebook.com/${options.apiVersion ?? "v23.0"}/${options.phoneNumberId}/messages`;
	}

	async sendOrderStatus(phone: string, _status: string, _orderId: string, message?: string): Promise<void> {
		const response = await this.fetchImpl(this.endpoint, {
			body: JSON.stringify(this.createPayload(phone, message ?? "Atualização do pedido.")),
			headers: {
				Authorization: `Bearer ${this.options.accessToken}`,
				"Content-Type": "application/json",
			},
			method: "POST",
		});

		if (!response.ok)
			throw new Error(`WhatsApp Cloud API request failed (${response.status}): ${await response.text()}`);
	}

	private createPayload(phone: string, message: string) {
		const to = phone.replace(/\D/g, "");
		if (!this.options.templateName) {
			return {
				messaging_product: "whatsapp",
				recipient_type: "individual" as const,
				text: { body: message, preview_url: false },
				to,
				type: "text" as const,
			};
		}
		return {
			messaging_product: "whatsapp",
			recipient_type: "individual" as const,
			template: {
				components: [{ parameters: [{ text: message, type: "text" }], type: "body" }],
				language: { code: this.options.templateLanguage ?? "pt_BR" },
				name: this.options.templateName,
			},
			to,
			type: "template" as const,
		};
	}
}
