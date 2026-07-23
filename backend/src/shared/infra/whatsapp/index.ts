export { ConsoleWhatsAppProvider } from "./implementations/ConsoleWhatsAppProvider";
export { DisabledWhatsAppProvider } from "./implementations/DisabledWhatsAppProvider";
export { MetaWhatsAppProvider } from "./implementations/MetaWhatsAppProvider";
export { WhatsAppProvider } from "./WhatsAppProvider";

import { ConsoleWhatsAppProvider } from "./implementations/ConsoleWhatsAppProvider";
import { DisabledWhatsAppProvider } from "./implementations/DisabledWhatsAppProvider";
import { MetaWhatsAppProvider } from "./implementations/MetaWhatsAppProvider";
import type { WhatsAppProvider } from "./WhatsAppProvider";

export function createWhatsAppProvider(): WhatsAppProvider {
	const driver = process.env.WHATSAPP_DRIVER ?? "disabled";
	switch (driver) {
		case "console":
			return new ConsoleWhatsAppProvider();
		case "meta": {
			const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
			const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
			if (!accessToken || !phoneNumberId) {
				throw new Error("WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required for WHATSAPP_DRIVER=meta");
			}
			return new MetaWhatsAppProvider({
				accessToken,
				apiVersion: process.env.WHATSAPP_API_VERSION,
				phoneNumberId,
				templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE,
				templateName: process.env.WHATSAPP_TEMPLATE_NAME,
			});
		}
		default:
			return new DisabledWhatsAppProvider();
	}
}
