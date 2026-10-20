import { APIError } from "better-auth/api";
import { prisma, type PrismaInstance } from "@/shared/infra/sql";
import { getWahaClientOptions, WahaClient } from "@/shared/infra/whatsapp";
import { PhoneOtpProvider } from "../models/PhoneOtpProvider";

export class WahaPhoneOtpProvider extends PhoneOtpProvider {
	private readonly client: WahaClient;

	constructor(
		client: WahaClient = new WahaClient(getWahaClientOptions()),
		private readonly database: Pick<PrismaInstance, "company"> = prisma,
	) {
		super();
		this.client = client;
	}

	async sendCode(phoneNumber: string, code: string): Promise<void> {
		const company = await this.database.company.findFirst({
			select: { whatsAppConnection: { select: { connectedPhone: true, sessionName: true } } },
		});
		const connection = company?.whatsAppConnection;
		if (!connection?.connectedPhone) {
			throw new APIError("FORBIDDEN", {
				code: "PHONE_LOGIN_NOT_ENABLED",
				message: "Login por celular não foi habilitado nesta empresa. Entre por e-mail.",
			});
		}
		return this.client.sendText(
			phoneNumber,
			`Seu código de acesso é ${code}. Ele expira em 30 minutos. Não compartilhe este código.`,
			connection.sessionName,
		);
	}
}
