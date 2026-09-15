import { ConsolePhoneOtpProvider } from "./implementations/ConsolePhoneOtpProvider";
import { TwilioPhoneOtpProvider } from "./implementations/TwilioPhoneOtpProvider";
import { WahaPhoneOtpProvider } from "./implementations/WahaPhoneOtpProvider";
import type { PhoneOtpProvider } from "./models/PhoneOtpProvider";

export enum PhoneOtpProvidersEnum {
	CONSOLE = "console",
	TWILIO = "twilio",
	WHATSAPP = "whatsapp",
}

export type PhoneOtpProviderKey = `${PhoneOtpProvidersEnum}`;

export const phoneOtpProviders: Record<PhoneOtpProviderKey, new () => PhoneOtpProvider> = {
	[PhoneOtpProvidersEnum.CONSOLE]: ConsolePhoneOtpProvider,
	[PhoneOtpProvidersEnum.TWILIO]: TwilioPhoneOtpProvider,
	[PhoneOtpProvidersEnum.WHATSAPP]: WahaPhoneOtpProvider,
};

export { PhoneOtpProvider } from "./models/PhoneOtpProvider";
export { WahaPhoneOtpProvider } from "./implementations/WahaPhoneOtpProvider";
