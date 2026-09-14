export abstract class WhatsAppProvider {
	abstract readonly deliveryMode: "direct" | "outbox";
	abstract sendText(phone: string, message: string): Promise<void>;
}
