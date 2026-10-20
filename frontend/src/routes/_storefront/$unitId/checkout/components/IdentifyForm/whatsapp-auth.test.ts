import { describe, expect, it } from "bun:test";
import { formatBrazilianWhatsAppInput, getIdentifierKind, isValidEmail, isValidOtp, toBrazilianE164 } from "./whatsapp-auth";

describe("toBrazilianE164", () => {
	it("adds Brazil country code to a local mobile number", () => {
		expect(toBrazilianE164("(81) 99999-9999")).toBe("+5581999999999");
	});

	it("keeps a complete Brazilian number", () => {
		expect(toBrazilianE164("+55 (81) 99999-9999")).toBe("+5581999999999");
	});

	it("rejects incomplete and foreign numbers", () => {
		expect(toBrazilianE164("819999999")).toBeNull();
		expect(toBrazilianE164("+1 202 555 0100")).toBeNull();
	});
});

describe("isValidOtp", () => {
	it("accepts exactly six digits", () => {
		expect(isValidOtp("123456")).toBeTrue();
		expect(isValidOtp("12345")).toBeFalse();
		expect(isValidOtp("1234567")).toBeFalse();
	});
});

describe("getIdentifierKind", () => {
	it("detects an email before attempting phone normalization", () => {
		expect(isValidEmail("cliente@exemplo.com")).toBeTrue();
		expect(getIdentifierKind("cliente@exemplo.com")).toBe("email");
	});

	it("detects a Brazilian mobile number without depending on store WhatsApp branding", () => {
		expect(getIdentifierKind("(81) 99999-9999")).toBe("phone");
		expect(getIdentifierKind("+55 (81) 99999-9999")).toBe("phone");
	});

	it("keeps incomplete contacts invalid", () => {
		expect(getIdentifierKind("(81) 99999-999")).toBeNull();
		expect(getIdentifierKind("cliente@exemplo")).toBeNull();
		expect(getIdentifierKind("")).toBeNull();
	});
});

describe("formatBrazilianWhatsAppInput", () => {
	it("formats local and international Brazilian WhatsApp numbers", () => {
		expect(formatBrazilianWhatsAppInput("81999999999")).toBe("(81) 99999-9999");
		expect(formatBrazilianWhatsAppInput("+5581999999999")).toBe("+55 (81) 99999-9999");
	});

	it("preserves an email address without applying a phone mask", () => {
		expect(formatBrazilianWhatsAppInput("cliente@exemplo.com")).toBe("cliente@exemplo.com");
	});
});
