export abstract class WhatsAppProvider {
	abstract sendOrderStatus(phone: string, status: string, orderId: string, message?: string): Promise<void>;
}
