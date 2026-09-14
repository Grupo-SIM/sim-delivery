import { describe, expect, it, mock } from "bun:test";
import { InvalidWhatsAppPhoneError, normalizeBrazilianWhatsAppPhone, WahaClient } from "./WahaClient";

describe("normalizeBrazilianWhatsAppPhone", () => {
	it("normalizes a formatted Brazilian mobile number", () => {
		expect(normalizeBrazilianWhatsAppPhone("+55 (81) 99999-9999")).toBe("5581999999999");
	});

	it("rejects a number outside the supported E.164 shape", () => {
		expect(() => normalizeBrazilianWhatsAppPhone("81999999999")).toThrow(InvalidWhatsAppPhoneError);
	});
});

describe("WahaClient", () => {
	it("does not expose WAHA response content in errors", async () => {
		const client = new WahaClient(
			{ apiKey: "secret", baseUrl: "https://waha.example", session: "default" },
			mock(() => Promise.resolve(new Response("sensitive upstream detail", { status: 500 }))) as never,
		);

		await expect(client.sendText("5581999999999", "secret message")).rejects.toThrow(
			"WAHA request failed (500)",
		);
	});

	it("propagates a request timeout", async () => {
		const timeout = new DOMException("Timed out", "TimeoutError");
		const client = new WahaClient(
			{ baseUrl: "https://waha.example", session: "default", timeoutMs: 1 },
			mock(() => Promise.reject(timeout)) as never,
		);

		await expect(client.sendText("5581999999999", "message")).rejects.toThrow("Timed out");
	});
});
