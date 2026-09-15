import { describe, expect, it } from "bun:test";
import {
	getOrderStatusWhatsAppTemplate,
	normalizeOrderStatusWhatsAppTemplates,
} from "./orderStatusWhatsAppTemplates";

describe("order status WhatsApp templates", () => {
	it("normalizes legacy string templates without losing their message", () => {
		expect(normalizeOrderStatusWhatsAppTemplates({ pronto: "Pedido pronto" })).toEqual({
			pronto: { message: "Pedido pronto" },
		});
	});

	it("keeps structured templates with attachments", () => {
		const template = {
			attachments: [
				{ filename: "retirada.pdf", mimeType: "application/pdf" as const, url: "https://cdn.test/a.pdf" },
			],
			message: "Pode retirar",
		};

		expect(normalizeOrderStatusWhatsAppTemplates({ pronto: template })).toEqual({ pronto: template });
		expect(getOrderStatusWhatsAppTemplate({ pronto: template }, "pronto")).toEqual(template);
	});

	it("returns an empty template for an unknown status", () => {
		expect(getOrderStatusWhatsAppTemplate(null, "pronto")).toEqual({});
	});
});
