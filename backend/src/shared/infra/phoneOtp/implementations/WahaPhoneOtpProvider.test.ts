import { describe, expect, it, mock } from "bun:test";
import type { WahaClient } from "@/shared/infra/whatsapp";
import { WahaPhoneOtpProvider } from "./WahaPhoneOtpProvider";

describe("WahaPhoneOtpProvider", () => {
	it("sends the Better Auth code with expiry and safety copy", async () => {
		const sendText = mock(() => Promise.resolve());
		const provider = new WahaPhoneOtpProvider({ sendText } as unknown as WahaClient);

		await provider.sendCode("5581999999999", "123456");

		expect(sendText).toHaveBeenCalledWith(
			"5581999999999",
			"Seu código de acesso é 123456. Ele expira em 5 minutos. Não compartilhe este código.",
		);
	});
});
