import { describe, expect, it, mock } from "bun:test";
import { WahaWhatsAppProvider } from "./WahaWhatsAppProvider";

describe("WahaWhatsAppProvider", () => {
	it("sends a text message through the configured WAHA session", async () => {
		const fetch = mock(() => Promise.resolve(new Response(null, { status: 200 })));
		const provider = new WahaWhatsAppProvider(
			{ apiKey: "secret", baseUrl: "http://waha:3000/", session: "delivery" },
			fetch as unknown as typeof globalThis.fetch,
		);

		await provider.sendOrderStatus("+55 (11) 99999-9999", "em_preparo", "ord_1", "Pedido pronto");

		expect(fetch).toHaveBeenCalledWith(
			"http://waha:3000/api/sendText",
			expect.objectContaining({
				body: JSON.stringify({
					chatId: "5511999999999@c.us",
					session: "delivery",
					text: "Pedido pronto",
				}),
				headers: { "Content-Type": "application/json", "X-Api-Key": "secret" },
				method: "POST",
			}),
		);
	});

	it("omits the API-key header when WAHA authentication is disabled", async () => {
		const fetch = mock(() => Promise.resolve(new Response(null, { status: 200 })));
		const provider = new WahaWhatsAppProvider(
			{ baseUrl: "http://localhost:3000", session: "default" },
			fetch as unknown as typeof globalThis.fetch,
		);

		await provider.sendOrderStatus("5511999999999", "em_preparo", "ord_1");

		expect(fetch).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ headers: { "Content-Type": "application/json" } }),
		);
	});

	it("throws when WAHA rejects the message", async () => {
		const provider = new WahaWhatsAppProvider(
			{ baseUrl: "http://localhost:3000", session: "default" },
			mock(() =>
				Promise.resolve(new Response("invalid", { status: 400 })),
			) as unknown as typeof globalThis.fetch,
		);

		await expect(provider.sendOrderStatus("5511999999999", "em_preparo", "ord_1")).rejects.toThrow(
			"WAHA request failed (400): invalid",
		);
	});
});
