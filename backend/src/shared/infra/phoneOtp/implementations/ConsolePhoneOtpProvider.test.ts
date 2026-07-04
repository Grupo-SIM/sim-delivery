import { describe, expect, it, spyOn } from "bun:test";
import { ConsolePhoneOtpProvider } from "./ConsolePhoneOtpProvider";

describe("ConsolePhoneOtpProvider", () => {
	it("logs the code instead of sending a real message", async () => {
		const log = spyOn(console, "log").mockImplementation(() => {});

		await new ConsolePhoneOtpProvider().sendCode("+5511999999999", "123456");

		expect(log).toHaveBeenCalledWith(expect.stringContaining("+5511999999999"));
		expect(log).toHaveBeenCalledWith(expect.stringContaining("123456"));

		log.mockRestore();
	});
});
