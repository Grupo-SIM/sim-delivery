export { WhatsAppProvider } from "./WhatsAppProvider";
export { ConsoleWhatsAppProvider } from "./implementations/ConsoleWhatsAppProvider";
export { DisabledWhatsAppProvider } from "./implementations/DisabledWhatsAppProvider";

import { ConsoleWhatsAppProvider } from "./implementations/ConsoleWhatsAppProvider";
import { DisabledWhatsAppProvider } from "./implementations/DisabledWhatsAppProvider";
import type { WhatsAppProvider } from "./WhatsAppProvider";

export function createWhatsAppProvider(): WhatsAppProvider {
	const driver = process.env.WHATSAPP_DRIVER ?? "disabled";
	switch (driver) {
		case "console":
			return new ConsoleWhatsAppProvider();
		default:
			return new DisabledWhatsAppProvider();
	}
}
