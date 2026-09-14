import { getWahaClientOptions, WahaClient } from "@/shared/infra/whatsapp";
import { PhoneOtpProvider } from "../models/PhoneOtpProvider";

export class WahaPhoneOtpProvider extends PhoneOtpProvider {
	private readonly client: WahaClient;

	constructor(client: WahaClient = new WahaClient(getWahaClientOptions())) {
		super();
		this.client = client;
	}

	sendCode(phoneNumber: string, code: string): Promise<void> {
		return this.client.sendText(
			phoneNumber,
			`Seu código de acesso é ${code}. Ele expira em 5 minutos. Não compartilhe este código.`,
		);
	}
}
