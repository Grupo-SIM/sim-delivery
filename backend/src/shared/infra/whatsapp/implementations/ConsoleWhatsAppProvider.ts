import { WhatsAppProvider } from "../WhatsAppProvider";

export class ConsoleWhatsAppProvider extends WhatsAppProvider {
	async sendOrderStatus(phone: string, status: string, orderId: string, message?: string): Promise<void> {
		console.log(`[WhatsApp] → ${phone}: ${message ?? `Order ${orderId} status updated to "${status}"`}`);
	}
}
