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
	for (const [method, action] of [["startSession", "start"], ["logoutSession", "logout"], ["restartSession", "restart"]] as const) {
		it(`reads current session after ${action} succeeds with an empty response`, async () => {
			const session = { name: "unit", status: "SCAN_QR_CODE" };
			const fetch = mock((_input: string | URL | Request, init?: RequestInit) =>
				Promise.resolve(init?.method === "POST" ? new Response(null, { status: 204 }) : Response.json(session)),
			);
			const client = new WahaClient({ baseUrl: "https://waha.example", session: "general" }, fetch as never);
			expect(await client[method]("unit")).toEqual(session);
			expect(fetch.mock.calls[0]?.[0]).toBe(`https://waha.example/api/sessions/unit/${action}`);
			expect(fetch.mock.calls[1]?.[0]).toBe("https://waha.example/api/sessions/unit");
		});
	}

	it("creates and starts a named session with tenant metadata", async () => {
		const fetch = mock((_input: string | URL | Request, _init?: RequestInit) =>
			Promise.resolve(Response.json({ name: "sim-delivery_acme_centro", status: "STARTING" }, { status: 201 })),
		);
		const client = new WahaClient(
			{ apiKey: "secret", baseUrl: "https://waha.example/", session: "general" },
			fetch as never,
		);

		await client.createSession("sim-delivery_acme_centro", {
			"sim-delivery.companyId": "company_1",
			"sim-delivery.unitId": "unit_1",
		});

		expect(fetch).toHaveBeenCalledWith(
			"https://waha.example/api/sessions",
			expect.objectContaining({
				body: JSON.stringify({
					config: {
						metadata: {
							"sim-delivery.companyId": "company_1",
							"sim-delivery.unitId": "unit_1",
						},
					},
					name: "sim-delivery_acme_centro",
					start: true,
				}),
				headers: expect.objectContaining({ "X-Api-Key": "secret" }),
				method: "POST",
			}),
		);
	});

	it("returns the current QR as a non-persisted data URL", async () => {
		const fetch = mock((_input: string | URL | Request, _init?: RequestInit) =>
			Promise.resolve(new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": "image/png" } })),
		);
		const client = new WahaClient({ baseUrl: "https://waha.example", session: "general" }, fetch as never);

		expect(await client.getQrDataUrl("sim-delivery_acme_centro")).toBe("data:image/png;base64,AQID");
		expect(fetch.mock.calls[0]?.[0]).toBe(
			"https://waha.example/api/sim-delivery_acme_centro/auth/qr?format=image",
		);
	});

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
		const fetch = mock((_input: string | URL | Request, _init?: RequestInit) =>
			Promise.resolve(new Response(null, { status: 201 })),
		);
		const client = new WahaClient({ baseUrl: "https://waha.example", session: "default" }, fetch as never);

		await client.sendText("+55 (83) 98769-0902", "message");

		expect(JSON.parse(fetch.mock.calls[0]![1]!.body as string)).toMatchObject({
			chatId: "558387690902@c.us",
			session: "default",
			text: "message",
		});
	});

	it("overrides the global session for a unit delivery", async () => {
		const fetch = mock((_input: string | URL | Request, _init?: RequestInit) =>
			Promise.resolve(new Response(null, { status: 201 })),
		);
		const client = new WahaClient({ baseUrl: "https://waha.example", session: "general" }, fetch as never);

		await client.sendText("5581999999999", "message", "sim-delivery_acme_centro");

		expect(JSON.parse(fetch.mock.calls[0]![1]!.body as string).session).toBe("sim-delivery_acme_centro");
	});

	it("falls back to the canonical Brazilian JID when the legacy JID fails", async () => {
		const fetch = mock((_input: string | URL | Request, _init?: RequestInit) =>
			Promise.resolve(new Response(null, { status: 500 })),
		);
		fetch.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 500 })));
		fetch.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 201 })));
		const client = new WahaClient({ baseUrl: "https://waha.example", session: "default" }, fetch as never);

		await client.sendText("+55 (83) 98769-0902", "message");

		expect(fetch).toHaveBeenCalledTimes(2);
		expect(JSON.parse(fetch.mock.calls[0]![1]!.body as string).chatId).toBe("558387690902@c.us");
		expect(JSON.parse(fetch.mock.calls[1]![1]!.body as string).chatId).toBe("5583987690902@c.us");
	});

	it("sends the message as first attachment caption and preserves line breaks", async () => {
		const fetch = mock((_input: string | URL | Request, _init?: RequestInit) =>
			Promise.resolve(new Response(null, { status: 201 })),
		);
		const client = new WahaClient({ baseUrl: "https://waha.example", session: "delivery" }, fetch as never);

		await client.sendMessage("5581999999999", {
			attachments: [
				{ filename: "cardapio.pdf", mimeType: "application/pdf", url: "https://cdn.test/cardapio.pdf" },
			],
			text: "Pedido pronto.\nPode retirar.",
		});

		expect(fetch).toHaveBeenCalledWith(
			"https://waha.example/api/sendFile",
			expect.objectContaining({
				body: JSON.stringify({
					caption: "Pedido pronto.\nPode retirar.",
					chatId: "558199999999@c.us",
					file: {
						filename: "cardapio.pdf",
						mimetype: "application/pdf",
						url: "https://cdn.test/cardapio.pdf",
					},
					session: "delivery",
				}),
			}),
		);
	});

	it("sends later attachments without repeating the caption", async () => {
		const fetch = mock((_input: string | URL | Request, _init?: RequestInit) =>
			Promise.resolve(new Response(null, { status: 201 })),
		);
		const client = new WahaClient({ baseUrl: "https://waha.example", session: "delivery" }, fetch as never);

		await client.sendMessage("5581999999999", {
			attachments: [
				{ filename: "a.png", mimeType: "image/png", url: "https://cdn.test/a.png" },
				{ filename: "b.webp", mimeType: "image/webp", url: "https://cdn.test/b.webp" },
			],
			text: "Pedido pronto",
		});

		expect(fetch).toHaveBeenCalledTimes(2);
		expect(JSON.parse(fetch.mock.calls[0]![1]!.body as string).caption).toBe("Pedido pronto");
		expect(JSON.parse(fetch.mock.calls[1]![1]!.body as string)).not.toHaveProperty("caption");
	});
});
