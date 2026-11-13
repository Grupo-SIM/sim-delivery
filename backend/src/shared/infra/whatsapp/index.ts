export { ConsoleWhatsAppProvider } from "./implementations/ConsoleWhatsAppProvider";
export { DisabledWhatsAppProvider } from "./implementations/DisabledWhatsAppProvider";
export { WahaWhatsAppProvider } from "./implementations/WahaWhatsAppProvider";
export { WhatsAppProvider, type WhatsAppSender } from "./WhatsAppProvider";
export type { WhatsAppAttachment, WhatsAppMessage } from "./WhatsAppMessage";
export { dispatchWhatsApp, ProcessWhatsAppOutbox, startWhatsAppOutboxWorker } from "./WhatsAppOutbox";
export { startWhatsAppSessionWatchdog, WhatsAppSessionWatchdog } from "./WhatsAppSessionWatchdog";
export {
	getWahaClientOptions,
	getWahaBrazilianChatIds,
	InvalidWhatsAppPhoneError,
	normalizeBrazilianWhatsAppPhone,
	toWahaBrazilianChatId,
	WahaClient,
	WahaRequestError,
	type WahaSessionInfo,
	type WahaSessionStatus,
} from "./WahaClient";

import { ConsoleWhatsAppProvider } from "./implementations/ConsoleWhatsAppProvider";
import { DisabledWhatsAppProvider } from "./implementations/DisabledWhatsAppProvider";
import { WahaWhatsAppProvider } from "./implementations/WahaWhatsAppProvider";
import type { WhatsAppProvider } from "./WhatsAppProvider";
import { getWahaClientOptions } from "./WahaClient";

export function createWhatsAppProvider(): WhatsAppProvider {
	const driver = process.env.WHATSAPP_DRIVER ?? "disabled";
	switch (driver) {
		case "console":
			return new ConsoleWhatsAppProvider();
		case "waha": {
			return new WahaWhatsAppProvider(getWahaClientOptions());
		}
		default:
			return new DisabledWhatsAppProvider();
	}
}
