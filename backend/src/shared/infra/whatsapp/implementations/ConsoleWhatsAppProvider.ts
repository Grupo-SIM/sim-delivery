import { WhatsAppProvider } from "../WhatsAppProvider";

export class ConsoleWhatsAppProvider extends WhatsAppProvider {
	readonly deliveryMode = "direct" as const;

	async sendText(phone: string, message: string): Promise<void> {
		console.log(`[WhatsApp] → ${phone}: ${message}`);
	}
}
