import { WhatsAppProvider } from "../WhatsAppProvider";

export class ConsoleWhatsAppProvider extends WhatsAppProvider {
	async sendOrderStatus(phone: string, status: string, orderId: string): Promise<void> {
		console.log(`[WhatsApp] → ${phone}: Order ${orderId} status updated to "${status}"`);
	}
}
