import { describe, expect, it } from "bun:test";
import { hasCompletePaymentIdentity } from "./payment-identity";

describe("hasCompletePaymentIdentity", () => {
	it("accepts a full name and an eleven-digit CPF", () => {
		expect(hasCompletePaymentIdentity("Maria da Silva", "123.456.789-01")).toBe(true);
	});

	it("keeps payment blocked when the name is incomplete", () => {
		expect(hasCompletePaymentIdentity("Maria", "123.456.789-01")).toBe(false);
	});

	it("keeps payment blocked when the CPF is missing or incomplete", () => {
		expect(hasCompletePaymentIdentity("Maria Silva", null)).toBe(false);
		expect(hasCompletePaymentIdentity("Maria Silva", "123.456.789-0")).toBe(false);
	});
});
