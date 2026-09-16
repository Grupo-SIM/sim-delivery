import { describe, expect, it } from "bun:test";
import { getBrazilianMobileDigits, hasCompletePaymentIdentity, toBrazilianMobilePhone } from "./payment-identity";

describe("hasCompletePaymentIdentity", () => {
	it("accepts a full name, valid CPF, and Brazilian mobile number", () => {
		expect(hasCompletePaymentIdentity("Maria da Silva", "529.982.247-25", "+55 (81) 99999-9999")).toBe(true);
	});

	it("accepts the local digits returned by the Brazilian phone mask", () => {
		expect(hasCompletePaymentIdentity("Maria da Silva", "529.982.247-25", "81999999999")).toBe(true);
		expect(getBrazilianMobileDigits("5581999999999")).toBe("81999999999");
		expect(toBrazilianMobilePhone("81999999999")).toBe("5581999999999");
	});

	it("keeps payment blocked when the name is incomplete", () => {
		expect(hasCompletePaymentIdentity("Maria", "529.982.247-25", "5581999999999")).toBe(false);
	});

	it("keeps payment blocked when the CPF is missing or incomplete", () => {
		expect(hasCompletePaymentIdentity("Maria Silva", null, "5581999999999")).toBe(false);
		expect(hasCompletePaymentIdentity("Maria Silva", "123.456.789-0", "5581999999999")).toBe(false);
	});

	it("keeps payment blocked when the CPF has invalid check digits", () => {
		expect(hasCompletePaymentIdentity("Maria Silva", "702.677.874-97", "5581999999999")).toBe(false);
	});

	it("keeps payment blocked when the phone is missing or incomplete", () => {
		expect(hasCompletePaymentIdentity("Maria Silva", "529.982.247-25", null)).toBe(false);
		expect(hasCompletePaymentIdentity("Maria Silva", "529.982.247-25", "8199999999")).toBe(false);
	});
});
