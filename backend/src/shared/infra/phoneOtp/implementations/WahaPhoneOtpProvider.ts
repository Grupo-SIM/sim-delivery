import { buildCompanyWhatsAppSessionName } from "@/modules/branding/useCases";
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
		const company = await this.database.company.findFirst({ select: { slug: true } });
		if (!company) throw new Error("Company is required for WhatsApp OTP.");
		return this.client.sendText(
			phoneNumber,
			`Seu código de acesso é ${code}. Ele expira em 30 minutos. Não compartilhe este código.`,
			buildCompanyWhatsAppSessionName(company.slug),
		);
	}
}
