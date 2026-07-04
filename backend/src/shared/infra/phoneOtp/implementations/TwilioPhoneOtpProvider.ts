import { PhoneOtpProvider } from "../models/PhoneOtpProvider";

/** Calls Twilio's REST API directly via fetch — no SDK dependency needed for a single endpoint. */
export class TwilioPhoneOtpProvider extends PhoneOtpProvider {
	async sendCode(phoneNumber: string, code: string): Promise<void> {
		const accountSid = process.env.TWILIO_ACCOUNT_SID;
		const authToken = process.env.TWILIO_AUTH_TOKEN;
		const from = process.env.TWILIO_FROM_NUMBER;

		const body = new URLSearchParams({
			Body: `Seu código de acesso: ${code}`,
			From: from!,
			To: phoneNumber,
		});

		const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
			body,
			headers: {
				Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			method: "POST",
		});

		if (!response.ok) {
			throw new Error(`Twilio SMS failed: ${response.status} ${await response.text()}`);
		}
	}
}
