import { WhatsAppProvider } from "../WhatsAppProvider";
import type { WhatsAppMessage } from "../WhatsAppMessage";

export class DisabledWhatsAppProvider extends WhatsAppProvider {
	readonly deliveryMode = "direct" as const;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async sendMessage(_phone: string, _message: WhatsAppMessage): Promise<void> {}
}
