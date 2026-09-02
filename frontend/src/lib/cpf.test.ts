import { describe, expect, it } from "bun:test";
import { isValidCpf } from "./cpf";

describe("isValidCpf", () => {
	it("accepts a CPF with valid check digits", () => {
		expect(isValidCpf("529.982.247-25")).toBe(true);
	});

	it("rejects CPF with invalid check digits", () => {
		expect(isValidCpf("70267787497")).toBe(false);
	});

	it("rejects repeated, missing, and incomplete CPFs", () => {
		expect(isValidCpf("111.111.111-11")).toBe(false);
		expect(isValidCpf(null)).toBe(false);
		expect(isValidCpf("529.982.247-2")).toBe(false);
	});
});
