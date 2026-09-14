import { WhatsAppProvider } from "../WhatsAppProvider";

export class DisabledWhatsAppProvider extends WhatsAppProvider {
	readonly deliveryMode = "direct" as const;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async sendText(_phone: string, _message: string): Promise<void> {}
}
