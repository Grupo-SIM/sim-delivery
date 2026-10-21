import { describe, expect, it } from "bun:test";
import { isValidMerchantDocument } from "./merchant-document";

describe("merchant document", () => {
	it("accepts CPF and CNPJ with valid check digits", () => {
		for (const value of ["52998224725", "11144477735", "10802530000107", "11222333000181"]) expect(isValidMerchantDocument(value)).toBe(true);
	});
	it("rejects malformed documents, repeated digits and invalid check digits", () => {
		for (const value of ["", "123", "52998224724", "10802530000108", "11111111111", "00000000000000", "10.802.530/0001-07", "1080253000010x"]) expect(isValidMerchantDocument(value)).toBe(false);
	});
});
