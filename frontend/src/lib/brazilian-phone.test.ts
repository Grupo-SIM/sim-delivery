import { describe, expect, it } from "bun:test";
import { getBrazilianMobileDigits, resolveCustomerPhone, toBrazilianMobilePhone } from "./brazilian-phone";

describe("Brazilian mobile phone", () => {
	it("keeps the mask value local while normalizing it for storage", () => {
		expect(getBrazilianMobileDigits("+55 (83) 98769-0902")).toBe("83987690902");
		expect(toBrazilianMobilePhone("83987690902")).toBe("5583987690902");
	});

	it("accepts an already normalized stored number", () => {
		expect(getBrazilianMobileDigits("5583987690902")).toBe("83987690902");
		expect(toBrazilianMobilePhone("5583987690902")).toBe("5583987690902");
	});
});

describe("resolveCustomerPhone", () => {
	it("uses the login phone before a customer contact is saved", () => {
		for (const phone of [null, undefined, "", " "]) {
			expect(resolveCustomerPhone(phone, "+5583999027523")).toBe("+5583999027523");
		}
	});
	it("preserves an explicitly saved customer contact", () => {
		expect(resolveCustomerPhone("5581999999999", "+5583999027523")).toBe("5581999999999");
	});
	it("keeps missing phones empty without deriving them from email or name", () => {
		expect(resolveCustomerPhone(null, null)).toBeNull();
	});
});
