import { describe, expect, it } from "bun:test";
import { evaluateCoverage, hasShortfall, surchargeComponents } from "./feeCoverage";

const pix = { fixedCents: 50, installments: 1, method: "PIX", ratePpm: 9_800 };

describe("fee coverage", () => {
	it("adds surcharge components (basis points become ppm)", () => {
		expect(
			surchargeComponents([
				{ fixedValue: 100, percentageValue: 400 },
				{ fixedValue: 0, percentageValue: 50 },
			]),
		).toEqual({ fixedCents: 100, ratePpm: 45_000 });
	});

	it("counts both fee sets in both mode", () => {
		const lanes = evaluateCoverage({
			costs: [pix],
			mode: "both",
			simintpay: [{ ...pix, fixedCents: 0, ratePpm: 5_000 }],
			surcharges: { fixedCents: 50, ratePpm: 5_000 },
		});
		expect(hasShortfall(lanes)).toBe(false);
	});

	it("ignores surcharges in simintpay mode and SimIntPay fees in extras mode", () => {
		const input = { costs: [pix], simintpay: [{ ...pix, fixedCents: 0, ratePpm: 5_000 }], surcharges: { fixedCents: 100, ratePpm: 20_000 } };
		expect(evaluateCoverage({ ...input, mode: "simintpay" })[0]).toMatchObject({ fixedShortfallCents: 50, rateShortfallPpm: 4_800 });
		expect(evaluateCoverage({ ...input, mode: "extras" })[0]).toMatchObject({ fixedShortfallCents: 0, rateShortfallPpm: 0 });
	});

	it("reports a lane SimIntPay has no fee for as fully uncovered", () => {
		const [lane] = evaluateCoverage({ costs: [pix], mode: "simintpay", simintpay: [], surcharges: { fixedCents: 0, ratePpm: 0 } });
		expect(lane).toMatchObject({ fixedShortfallCents: 50, rateShortfallPpm: 9_800 });
	});
});
