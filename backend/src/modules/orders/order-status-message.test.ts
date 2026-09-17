import { describe, expect, it } from "bun:test";
import { formatOrderStatusMessage } from "./order-status-message";

describe("formatOrderStatusMessage", () => {
	it.each([
		["recebido", "Recebemos seu pedido #154 e ele já entrou na fila de preparo."],
		["em_preparo", "Seu pedido #154 já está sendo preparado com carinho. Assim que ficar pronto, seguirá para entrega."],
		["pronto", "Seu pedido #154 está pronto e logo seguirá para entrega."],
		["saiu_para_entrega", "Seu pedido #154 saiu para entrega e está a caminho."],
		["entregue", "Seu pedido #154 chegou até você. Esperamos que aproveite cada detalhe!"],
	])("formats the %s email message", (status, expected) => {
		expect(formatOrderStatusMessage(undefined, status, 154)).toBe(expected);
	});

	it.each([
		["entregue", "Seu pedido #154 foi retirado. Esperamos que aproveite cada detalhe!"],
		["em_preparo", "Seu pedido #154 já está sendo preparado com carinho. Avisaremos assim que estiver pronto para retirada."],
		["pronto", "Seu pedido #154 está pronto para retirada. Esperamos você!"],
		["retirado", "Seu pedido #154 foi retirado. Esperamos que aproveite cada detalhe!"],
	])("formats the %s pickup message", (status, expected) => {
		expect(formatOrderStatusMessage(undefined, status, 154, "pickup")).toBe(expected);
	});

	it("inserts the cancellation reason when the template uses its slot", () => {
		expect(formatOrderStatusMessage("Seu pedido {{orderId}} foi cancelado.\nMotivo: {{reason}}", "cancelado", 154, "delivery", "Produto indisponível.")).toBe(
			"Seu pedido #154 foi cancelado.\nMotivo: Produto indisponível.",
		);
	});

	it("omits the cancellation reason when it is unavailable", () => {
		expect(formatOrderStatusMessage("Seu pedido {{orderId}} foi cancelado.\nMotivo: {{reason}}", "cancelado", 154)).toBe(
			"Seu pedido #154 foi cancelado.",
		);
	});
});
