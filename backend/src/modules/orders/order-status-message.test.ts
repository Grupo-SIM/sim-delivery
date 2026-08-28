import { describe, expect, it } from "bun:test";
import { formatOrderStatusMessage } from "./order-status-message";

describe("formatOrderStatusMessage", () => {
	it.each([
		["recebido", "Recebemos seu pedido ord_1. Em breve começaremos o preparo."],
		["em_preparo", "Seu pedido ord_1 está em preparo."],
		["pronto", "Seu pedido ord_1 está pronto e logo seguirá para você."],
		["saiu_para_entrega", "Seu pedido ord_1 saiu para entrega."],
		["entregue", "Seu pedido ord_1 foi entregue. Bom apetite!"],
		["retirado", "Seu pedido ord_1 foi retirado. Bom apetite!"],
	])("formats the %s email message", (status, expected) => {
		expect(formatOrderStatusMessage(undefined, status, "ord_1")).toBe(expected);
	});
});
