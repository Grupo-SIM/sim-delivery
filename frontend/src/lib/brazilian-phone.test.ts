import { describe, expect, it } from "bun:test";
import { getBrazilianMobileDigits, toBrazilianMobilePhone } from "./brazilian-phone";

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
