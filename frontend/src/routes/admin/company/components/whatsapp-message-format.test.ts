import { describe, expect, it } from "bun:test";
import { parseWhatsAppMessage, parseWhatsAppMessageBlocks } from "./whatsapp-message-format";

describe("parseWhatsAppMessage", () => {
	it("parses WhatsApp formatting markers", () => {
		expect(parseWhatsAppMessage("*forte* _inclinado_ ~riscado~ ```código```")).toEqual([
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
		expect(parseWhatsAppMessage("*Pedido _confirmado_*")).toEqual([
			{
				children: [
					{ content: "Pedido ", type: "text" },
					{ children: [{ content: "confirmado", type: "text" }], type: "italic" },
				],
				type: "bold",
			},
		]);
	});

	it("parses unordered and ordered lists with inline formatting", () => {
		expect(parseWhatsAppMessageBlocks("- *Prato* principal\n- Sobremesa\n1. Primeiro\n2. _Segundo_")).toEqual(
			[
				{
					items: [
						[
							{ children: [{ content: "Prato", type: "text" }], type: "bold" },
							{ content: " principal", type: "text" },
						],
						[{ content: "Sobremesa", type: "text" }],
					],
					type: "unordered-list",
				},
				{
					items: [
						[{ content: "Primeiro", type: "text" }],
						[{ children: [{ content: "Segundo", type: "text" }], type: "italic" }],
					],
					type: "ordered-list",
				},
			],
		);
	});

	it("parses quotes separately from paragraphs", () => {
		expect(parseWhatsAppMessageBlocks("Mensagem\n> Observação\nFinal")).toEqual([
			{ segments: [{ content: "Mensagem", type: "text" }], type: "paragraph" },
			{ segments: [{ content: "Observação", type: "text" }], type: "quote" },
			{ segments: [{ content: "Final", type: "text" }], type: "paragraph" },
		]);
	});
});
