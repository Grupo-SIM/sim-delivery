import { describe, expect, it } from "bun:test";
import { formatMoney, formatOdd, formatPercent } from "./formatMoney";

/** Intl inserts a non-breaking space after the currency symbol. */
const normalize = (value: string) => value.replace(/ /g, " ");

describe("formatMoney", () => {
	it("formats reais with two decimals by default", () => {
		expect(normalize(formatMoney(1234.5))).toBe("R$ 1.234,50");
	});

	it("always keeps two decimals", () => {
		expect(normalize(formatMoney(10))).toBe("R$ 10,00");
	});

	it("rounds beyond two decimals", () => {
		expect(normalize(formatMoney(1.005))).toBe("R$ 1,01");
	});

	it("formats zero", () => {
		expect(normalize(formatMoney(0))).toBe("R$ 0,00");
	});

	it("formats negative amounts", () => {
		expect(normalize(formatMoney(-5))).toBe("-R$ 5,00");
	});

	it("honours another locale and currency", () => {
		expect(normalize(formatMoney(1234.5, "en-US", "USD"))).toBe("$1,234.50");
	});

	it("returns the same result when the cached formatter is reused", () => {
		expect(formatMoney(99.9)).toBe(formatMoney(99.9));
	});
});

describe("formatOdd", () => {
	it("pads to two decimals", () => {
		expect(formatOdd(2)).toBe("2.00");
	});

	it("truncates extra precision", () => {
		expect(formatOdd(1.239)).toBe("1.24");
	});
});

describe("formatPercent", () => {
	it("renders a fraction as a percentage", () => {
		expect(normalize(formatPercent(0.15))).toBe("15%");
	});

	it("keeps at most one decimal", () => {
		expect(normalize(formatPercent(0.1234))).toBe("12,3%");
	});

	it("drops trailing zero decimals", () => {
		expect(normalize(formatPercent(0.5))).toBe("50%");
	});
});
