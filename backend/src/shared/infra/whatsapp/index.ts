export { ConsoleWhatsAppProvider } from "./implementations/ConsoleWhatsAppProvider";
export { DisabledWhatsAppProvider } from "./implementations/DisabledWhatsAppProvider";
export { WahaWhatsAppProvider } from "./implementations/WahaWhatsAppProvider";
export { WhatsAppProvider } from "./WhatsAppProvider";

import { ConsoleWhatsAppProvider } from "./implementations/ConsoleWhatsAppProvider";
import { DisabledWhatsAppProvider } from "./implementations/DisabledWhatsAppProvider";
import { WahaWhatsAppProvider } from "./implementations/WahaWhatsAppProvider";
import type { WhatsAppProvider } from "./WhatsAppProvider";

export function createWhatsAppProvider(): WhatsAppProvider {
	const driver = process.env.WHATSAPP_DRIVER ?? "disabled";
	switch (driver) {
		case "console":
			return new ConsoleWhatsAppProvider();
		case "waha": {
			const baseUrl = process.env.WAHA_BASE_URL;
			if (!baseUrl) throw new Error("WAHA_BASE_URL is required for WHATSAPP_DRIVER=waha");
			return new WahaWhatsAppProvider({
				apiKey: process.env.WAHA_API_KEY,
				baseUrl,
				session: process.env.WAHA_SESSION ?? "default",
			});
		}
		default:
			return new DisabledWhatsAppProvider();
	}
}
