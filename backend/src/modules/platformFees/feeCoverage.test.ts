import { describe, expect, it } from "bun:test";
import { evaluateCoverage, hasShortfall, surchargeComponents } from "./feeCoverage";

const pix = { fixedCents: 50, installments: 1, method: "PIX", ratePpm: 9_800 };

describe("fee coverage", () => {
	it("applies existing fee modes to interest-inclusive upstream costs without compounding", () => {
		const cost = { fixedCents: 50, installments: 12, method: "CREDIT_CARD", ratePpm: 100_000 };
		const input = {
			costs: [cost],
			simintpay: [{ ...cost, fixedCents: 20, ratePpm: 90_000 }],
			surcharges: surchargeComponents([{ fixedValue: 30, percentageValue: 100 }]),
		};
		expect(evaluateCoverage({ ...input, mode: "SIMINTPAY_ONLY" })[0]).toMatchObject({ fixedShortfallCents: 30, rateShortfallPpm: 10_000 });
		expect(evaluateCoverage({ ...input, mode: "ADDITIVE_ONLY" })[0]).toMatchObject({ covered: { fixedCents: 30, ratePpm: 10_000 }, fixedShortfallCents: 20, rateShortfallPpm: 90_000 });
		const combined = evaluateCoverage({ ...input, mode: "BOTH" });
		expect(combined[0]).toMatchObject({ covered: { fixedCents: 50, ratePpm: 100_000 }, fixedShortfallCents: 0, rateShortfallPpm: 0 });
		expect(hasShortfall(combined)).toBe(false);
		for (const mode of ["SIMINTPAY_ONLY", "ADDITIVE_ONLY", "BOTH"] as const) {
			const enabled = evaluateCoverage({ ...input, costs: [pix, cost], disabledLanes: ["CREDIT_CARD/12"], mode });
			expect(enabled).toHaveLength(1);
			expect(enabled[0]).toMatchObject({ installments: 1, method: "PIX", cost: { ratePpm: 9_800 } });
		}
	});

	it("adds surcharge components (basis points become ppm)", () => {
		expect(
			surchargeComponents([
				{ fixedValue: 100, percentageValue: 400 },
				{ fixedValue: 0, percentageValue: 50 },
			]),
		).toEqual({ fixedCents: 100, ratePpm: 45_000 });
	});

	it("counts both fee sets in BOTH mode", () => {
		const lanes = evaluateCoverage({
			costs: [pix],
			mode: "BOTH",
			simintpay: [{ ...pix, fixedCents: 0, ratePpm: 5_000 }],
			surcharges: { fixedCents: 50, ratePpm: 5_000 },
		});
		expect(hasShortfall(lanes)).toBe(false);
	});

	it("ignores surcharges in SIMINTPAY_ONLY mode and SimIntPay fees in ADDITIVE_ONLY mode", () => {
		const input = { costs: [pix], simintpay: [{ ...pix, fixedCents: 0, ratePpm: 5_000 }], surcharges: { fixedCents: 100, ratePpm: 20_000 } };
		expect(evaluateCoverage({ ...input, mode: "SIMINTPAY_ONLY" })[0]).toMatchObject({ fixedShortfallCents: 50, rateShortfallPpm: 4_800 });
		expect(evaluateCoverage({ ...input, mode: "ADDITIVE_ONLY" })[0]).toMatchObject({ fixedShortfallCents: 0, rateShortfallPpm: 0 });
	});

	it("reports a lane SimIntPay has no fee for as fully uncovered", () => {
		const [lane] = evaluateCoverage({ costs: [pix], mode: "SIMINTPAY_ONLY", simintpay: [], surcharges: { fixedCents: 0, ratePpm: 0 } });
		expect(lane).toMatchObject({ fixedShortfallCents: 50, rateShortfallPpm: 9_800 });
	});

	it("skips disabled lanes so only accepted modalities must be covered", () => {
		const credit1 = { fixedCents: 100, installments: 1, method: "CREDIT_CARD", ratePpm: 39_900 };
		const credit12 = { fixedCents: 100, installments: 12, method: "CREDIT_CARD", ratePpm: 120_000 };
		const input = {
			costs: [credit1, credit12],
			mode: "SIMINTPAY_ONLY" as const,
			simintpay: [{ ...credit1, ratePpm: 60_000 }],
			surcharges: { fixedCents: 0, ratePpm: 0 },
		};
		expect(hasShortfall(evaluateCoverage(input))).toBe(true);
		const lanes = evaluateCoverage({ ...input, disabledLanes: ["CREDIT_CARD/12"] });
		expect(lanes).toHaveLength(1);
		expect(hasShortfall(lanes)).toBe(false);
	});
});
