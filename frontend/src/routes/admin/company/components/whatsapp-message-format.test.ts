import { describe, expect, it } from "bun:test";
import { parseWhatsAppMessage } from "./whatsapp-message-format";

describe("parseWhatsAppMessage", () => {
	it("parses WhatsApp formatting markers", () => {
		expect(parseWhatsAppMessage("*forte* _inclinado_ ~riscado~ ```código```"))
			.toEqual([
				{ children: [{ content: "forte", type: "text" }], type: "bold" },
				{ content: " ", type: "text" },
				{ children: [{ content: "inclinado", type: "text" }], type: "italic" },
				{ content: " ", type: "text" },
				{ children: [{ content: "riscado", type: "text" }], type: "strikethrough" },
				{ content: " ", type: "text" },
				{ children: [{ content: "código", type: "text" }], type: "monospace" },
			]);
	});

	it("keeps unmatched markers as plain text", () => {
		expect(parseWhatsAppMessage("Pedido *pendente")).toEqual([{ content: "Pedido *pendente", type: "text" }]);
	});

	it("supports nested formatting", () => {
		expect(parseWhatsAppMessage("*Pedido _confirmado_*"))
			.toEqual([
				{
					children: [
						{ content: "Pedido ", type: "text" },
						{ children: [{ content: "confirmado", type: "text" }], type: "italic" },
					],
					type: "bold",
				},
			]);
	});
});
