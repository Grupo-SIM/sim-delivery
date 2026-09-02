import { describe, expect, it } from "bun:test";
import { hasCompletePaymentIdentity } from "./payment-identity";

describe("hasCompletePaymentIdentity", () => {
	it("accepts a full name and a valid CPF", () => {
		expect(hasCompletePaymentIdentity("Maria da Silva", "529.982.247-25")).toBe(true);
	});

	it("keeps payment blocked when the name is incomplete", () => {
		expect(hasCompletePaymentIdentity("Maria", "529.982.247-25")).toBe(false);
	});

	it("keeps payment blocked when the CPF is missing or incomplete", () => {
		expect(hasCompletePaymentIdentity("Maria Silva", null)).toBe(false);
		expect(hasCompletePaymentIdentity("Maria Silva", "123.456.789-0")).toBe(false);
	});

	it("keeps payment blocked when the CPF has invalid check digits", () => {
		expect(hasCompletePaymentIdentity("Maria Silva", "702.677.874-97")).toBe(false);
	});
});
