import { describe, expect, it, mock } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { WahaClient } from "@/shared/infra/whatsapp";
import { WahaPhoneOtpProvider } from "./WahaPhoneOtpProvider";

describe("WahaPhoneOtpProvider", () => {
	it("sends the Better Auth code with expiry and safety copy", async () => {
		const sendText = mock(() => Promise.resolve());
		const database = {
			company: { findFirst: mock(async () => ({ whatsAppConnection: { connectedPhone: "+5581999999999", sessionName: "sim-delivery_acme" } })) },
		} as unknown as Pick<PrismaInstance, "company">;
		const provider = new WahaPhoneOtpProvider({ sendText } as unknown as WahaClient, database);

		await provider.sendCode("5581999999999", "123456");

		expect(sendText).toHaveBeenCalledWith(
			"5581999999999",
			"Seu código de acesso é 123456. Ele expira em 30 minutos. Não compartilhe este código.",
			"sim-delivery_acme",
		);
	});
	it.each([
		null,
		{ whatsAppConnection: null },
		{ whatsAppConnection: { connectedPhone: null, sessionName: "sim-delivery_acme" } },
	])("rejects unconfigured phone login before sending an OTP (%j)", async company => {
		const sendText = mock(() => Promise.resolve());
		const database = {
			company: { findFirst: mock(async () => company) },
		} as unknown as Pick<PrismaInstance, "company">;
		const provider = new WahaPhoneOtpProvider({ sendText } as unknown as WahaClient, database);

		await expect(provider.sendCode("5581999999999", "123456")).rejects.toMatchObject({
			body: {
				code: "PHONE_LOGIN_NOT_ENABLED",
				message: "Login por celular não foi habilitado nesta empresa. Entre por e-mail.",
			},
			status: "FORBIDDEN",
		});
		expect(sendText).not.toHaveBeenCalled();
	});

});
