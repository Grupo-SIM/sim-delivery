import { WhatsAppProvider } from "../WhatsAppProvider";
import { WahaClient, type WahaClientOptions } from "../WahaClient";

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

	sendText(phone: string, message: string): Promise<void> {
		return this.client.sendText(phone, message);
	}
}
