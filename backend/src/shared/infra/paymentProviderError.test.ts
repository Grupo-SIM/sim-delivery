import { describe, expect, it } from "bun:test";
import { extractPaymentProviderMessage } from "./paymentProviderError";

describe("extractPaymentProviderMessage", () => {
	it("reads DOM msg payloads", () => {
		expect(extractPaymentProviderMessage({ msg: "CPF inválido" })).toBe("CPF inválido");
	});

	it("joins message arrays", () => {
		expect(extractPaymentProviderMessage({ message: ["Cartão recusado.", "Sem limite."] })).toBe(
			"Cartão recusado. Sem limite.",
		);
	});

	it("reads nested status details", () => {
		expect(extractPaymentProviderMessage({ data: { status_details: "Saldo insuficiente" } })).toBe(
			"Saldo insuficiente",
		);
	});

	it("returns undefined for an invalid body", () => {
		expect(extractPaymentProviderMessage({ code: 400, status: "FAIL" })).toBeUndefined();
	});
});
