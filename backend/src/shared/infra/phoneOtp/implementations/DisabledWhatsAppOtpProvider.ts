import { PhoneOtpProvider } from "../models/PhoneOtpProvider";

/** WhatsApp channel is stubbed out until a WhatsApp Business API provider is contracted. */
export class DisabledWhatsAppOtpProvider extends PhoneOtpProvider {
	async sendCode(): Promise<void> {
		throw new Error("WhatsApp OTP channel is disabled.");
	}
}
