import { describe, expect, it } from "bun:test";
import { DisabledWhatsAppOtpProvider } from "./DisabledWhatsAppOtpProvider";

describe("DisabledWhatsAppOtpProvider", () => {
	it("rejects since the WhatsApp channel is not enabled yet", () => {
		expect(new DisabledWhatsAppOtpProvider().sendCode()).rejects.toThrow("WhatsApp OTP channel is disabled.");
	});
});
