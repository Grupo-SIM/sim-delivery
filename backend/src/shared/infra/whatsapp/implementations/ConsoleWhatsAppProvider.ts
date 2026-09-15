import { WhatsAppProvider } from "../WhatsAppProvider";
import type { WhatsAppMessage } from "../WhatsAppMessage";

export class ConsoleWhatsAppProvider extends WhatsAppProvider {
	readonly deliveryMode = "direct" as const;

	async sendMessage(phone: string, message: WhatsAppMessage): Promise<void> {
		console.log(`[WhatsApp] → ${phone}: ${message.text}`, message.attachments ?? []);
	}
}
