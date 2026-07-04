import { PhoneOtpProvider } from "../models/PhoneOtpProvider";

/** Dev fallback: logs the code instead of sending a real SMS (mirrors mail's Ethereal driver). */
export class ConsolePhoneOtpProvider extends PhoneOtpProvider {
	async sendCode(phoneNumber: string, code: string): Promise<void> {
		console.log(`[phone-otp] ${phoneNumber} → ${code}`);
	}
}
