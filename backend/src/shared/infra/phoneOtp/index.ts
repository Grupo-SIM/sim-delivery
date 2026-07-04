import { ConsolePhoneOtpProvider } from "./implementations/ConsolePhoneOtpProvider";
import { DisabledWhatsAppOtpProvider } from "./implementations/DisabledWhatsAppOtpProvider";
import { TwilioPhoneOtpProvider } from "./implementations/TwilioPhoneOtpProvider";
import type { PhoneOtpProvider } from "./models/PhoneOtpProvider";

export enum PhoneOtpProvidersEnum {
	CONSOLE = "console",
	TWILIO = "twilio",
	WHATSAPP_DISABLED = "whatsapp-disabled",
}

export type PhoneOtpProviderKey = `${PhoneOtpProvidersEnum}`;

export const phoneOtpProviders: Record<PhoneOtpProviderKey, new () => PhoneOtpProvider> = {
	[PhoneOtpProvidersEnum.CONSOLE]: ConsolePhoneOtpProvider,
	[PhoneOtpProvidersEnum.TWILIO]: TwilioPhoneOtpProvider,
	[PhoneOtpProvidersEnum.WHATSAPP_DISABLED]: DisabledWhatsAppOtpProvider,
};

export { PhoneOtpProvider } from "./models/PhoneOtpProvider";
