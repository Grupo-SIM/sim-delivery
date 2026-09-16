import { WhatsAppProvider } from "../WhatsAppProvider";
import { WahaClient, type WahaClientOptions, WahaRequestError } from "../WahaClient";
import type { WhatsAppMessage } from "../WhatsAppMessage";

/** WAHA provider. Requires a running WAHA instance and an authenticated session. */
export class WahaWhatsAppProvider extends WhatsAppProvider {
	readonly deliveryMode = "outbox" as const;
	private readonly client: WahaClient;

	constructor(
		options: WahaClientOptions,
		fetchImpl: typeof globalThis.fetch = globalThis.fetch,
	) {
		super();
		this.client = new WahaClient(options, fetchImpl);
	}

	sendMessage(phone: string, message: WhatsAppMessage, sessionName?: string): Promise<void> {
		return this.client.sendMessage(phone, message, sessionName);
	}

	override async getSessionStatus(sessionName: string): Promise<string> {
		try {
			return (await this.client.getSession(sessionName)).status;
		} catch (error) {
			if (error instanceof WahaRequestError && error.status === 404) return "MISSING";
			throw error;
		}
	}
}
