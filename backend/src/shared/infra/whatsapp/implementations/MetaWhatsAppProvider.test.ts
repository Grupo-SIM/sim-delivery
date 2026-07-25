import { describe, expect, it, mock } from "bun:test";
import { MetaWhatsAppProvider } from "./MetaWhatsAppProvider";

describe("MetaWhatsAppProvider", () => {
	it("sends a WhatsApp Cloud API text message", async () => {
		const fetch = mock(() => Promise.resolve(new Response(null, { status: 200 })));
		const provider = new MetaWhatsAppProvider(
			{ accessToken: "token", apiVersion: "v23.0", phoneNumberId: "123" },
			fetch as unknown as typeof globalThis.fetch,
		);

		await provider.sendOrderStatus("+55 (11) 99999-9999", "em_preparo", "ord_1", "Pedido pronto");

		expect(fetch).toHaveBeenCalledWith(
			"https://graph.facebook.com/v23.0/123/messages",
			expect.objectContaining({
				body: JSON.stringify({
					messaging_product: "whatsapp",
					recipient_type: "individual",
					text: { body: "Pedido pronto", preview_url: false },
					to: "5511999999999",
					type: "text",
				}),
				headers: expect.objectContaining({ Authorization: "Bearer token" }),
				method: "POST",
			}),
		);
	});

	it("throws when Meta rejects the message", async () => {
		const provider = new MetaWhatsAppProvider(
			{ accessToken: "token", phoneNumberId: "123" },
			mock(() =>
				Promise.resolve(new Response("invalid", { status: 400 })),
			) as unknown as typeof globalThis.fetch,
		);

		await expect(provider.sendOrderStatus("5511999999999", "em_preparo", "ord_1")).rejects.toThrow(
			"WhatsApp Cloud API request failed (400): invalid",
		);
	});

	it("uses the configured approved template for business-initiated messages", async () => {
		const fetch = mock(() => Promise.resolve(new Response(null, { status: 200 })));
		const provider = new MetaWhatsAppProvider(
			{ accessToken: "token", phoneNumberId: "123", templateName: "order_status" },
			fetch as unknown as typeof globalThis.fetch,
		);

		await provider.sendOrderStatus("5511999999999", "em_preparo", "ord_1", "Pedido em preparo");

		expect(fetch).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				body: JSON.stringify({
					messaging_product: "whatsapp",
					recipient_type: "individual",
					template: {
						components: [{ parameters: [{ text: "Pedido em preparo", type: "text" }], type: "body" }],
						language: { code: "pt_BR" },
						name: "order_status",
					},
					to: "5511999999999",
					type: "template",
				}),
			}),
		);
	});
});
