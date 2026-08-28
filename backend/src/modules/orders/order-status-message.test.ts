import { describe, expect, it } from "bun:test";
import { formatOrderStatusMessage } from "./order-status-message";

describe("formatOrderStatusMessage", () => {
	it.each([
		["recebido", "Recebemos seu pedido #154. Em breve começaremos o preparo."],
		["em_preparo", "Seu pedido #154 está em preparo."],
		["pronto", "Seu pedido #154 está pronto e logo seguirá para você."],
		["saiu_para_entrega", "Seu pedido #154 saiu para entrega."],
		["entregue", "Seu pedido #154 foi entregue. Bom apetite!"],
		["retirado", "Seu pedido #154 foi retirado. Bom apetite!"],
	])("formats the %s email message", (status, expected) => {
		expect(formatOrderStatusMessage(undefined, status, 154)).toBe(expected);
	});
});
