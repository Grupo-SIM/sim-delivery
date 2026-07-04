export abstract class PhoneOtpProvider {
	abstract sendCode(phoneNumber: string, code: string): Promise<void>;
}
