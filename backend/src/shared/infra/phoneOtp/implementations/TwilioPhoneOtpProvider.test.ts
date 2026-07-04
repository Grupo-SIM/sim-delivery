import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { TwilioPhoneOtpProvider } from "./TwilioPhoneOtpProvider";

describe("TwilioPhoneOtpProvider", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env.TWILIO_ACCOUNT_SID = "AC-test";
		process.env.TWILIO_AUTH_TOKEN = "secret-token";
		process.env.TWILIO_FROM_NUMBER = "+5511900000000";
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("posts the code to Twilio's REST API", async () => {
		const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 201 }));

		await new TwilioPhoneOtpProvider().sendCode("+5511999999999", "123456");

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
		expect(url).toBe("https://api.twilio.com/2010-04-01/Accounts/AC-test/Messages.json");
		expect(init.method).toBe("POST");
		expect((init.body as URLSearchParams).get("To")).toBe("+5511999999999");
		expect((init.body as URLSearchParams).get("Body")).toContain("123456");

		fetchSpy.mockRestore();
	});

	it("throws when Twilio responds with an error", async () => {
		const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("bad request", { status: 400 }),
		);

		expect(new TwilioPhoneOtpProvider().sendCode("+5511999999999", "123456")).rejects.toThrow(
			"Twilio SMS failed",
		);

		fetchSpy.mockRestore();
	});
});
