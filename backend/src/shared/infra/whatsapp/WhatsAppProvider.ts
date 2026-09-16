import type { WhatsAppMessage } from "./WhatsAppMessage";

export abstract class WhatsAppProvider {
	abstract readonly deliveryMode: "direct" | "outbox";
	abstract sendMessage(phone: string, message: WhatsAppMessage, sessionName?: string): Promise<void>;

	getSessionStatus?(sessionName: string): Promise<string>;

	sendText(phone: string, text: string): Promise<void> {
		return this.sendMessage(phone, { text });
	}
}

export type WhatsAppSender = Pick<WhatsAppProvider, "sendMessage"> &
	Partial<Pick<WhatsAppProvider, "deliveryMode" | "getSessionStatus">>;
