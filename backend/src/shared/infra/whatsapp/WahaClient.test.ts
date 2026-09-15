import { describe, expect, it, mock } from "bun:test";
import {
	InvalidWhatsAppPhoneError,
	normalizeBrazilianWhatsAppPhone,
	toWahaBrazilianChatId,
	WahaClient,
} from "./WahaClient";

describe("normalizeBrazilianWhatsAppPhone", () => {
	it("normalizes a formatted Brazilian mobile number", () => {
		expect(normalizeBrazilianWhatsAppPhone("+55 (81) 99999-9999")).toBe("5581999999999");
	});

	it("rejects a number outside the supported E.164 shape", () => {
		expect(() => normalizeBrazilianWhatsAppPhone("81999999999")).toThrow(InvalidWhatsAppPhoneError);
	});

	it("uses WAHA's legacy JID without the Brazilian mobile ninth digit", () => {
		expect(toWahaBrazilianChatId("+55 (83) 98769-0902")).toBe("558387690902@c.us");
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

	it("sends text to WAHA's Brazilian legacy chat ID", async () => {
		const fetch = mock(() => Promise.resolve(new Response(null, { status: 201 })));
		const client = new WahaClient({ baseUrl: "https://waha.example", session: "default" }, fetch as never);

		await client.sendText("+55 (83) 98769-0902", "message");

		expect(JSON.parse(fetch.mock.calls[0]![1]!.body as string)).toMatchObject({
			chatId: "558387690902@c.us",
			session: "default",
			text: "message",
		});
	});

	it("falls back to the canonical Brazilian JID when the legacy JID fails", async () => {
		const fetch = mock(() => Promise.resolve(new Response(null, { status: 500 })));
		fetch.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 500 })));
		fetch.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 201 })));
		const client = new WahaClient({ baseUrl: "https://waha.example", session: "default" }, fetch as never);

		await client.sendText("+55 (83) 98769-0902", "message");

		expect(fetch).toHaveBeenCalledTimes(2);
		expect(JSON.parse(fetch.mock.calls[0]![1]!.body as string).chatId).toBe("558387690902@c.us");
		expect(JSON.parse(fetch.mock.calls[1]![1]!.body as string).chatId).toBe("5583987690902@c.us");
	});
});
