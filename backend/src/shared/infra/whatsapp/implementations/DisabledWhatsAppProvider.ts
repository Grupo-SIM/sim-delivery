import { WhatsAppProvider } from "../WhatsAppProvider";

export class DisabledWhatsAppProvider extends WhatsAppProvider {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async sendOrderStatus(
		_phone: string,
		_status: string,
		_orderId: string,
		_message?: string,
	): Promise<void> {}
}
