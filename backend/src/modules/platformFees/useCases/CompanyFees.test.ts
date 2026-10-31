import { describe, expect, it } from "bun:test";
import type { SimpayCompanyFees } from "@/shared/infra/simpay";
import { CompanyFees } from "./CompanyFees";

const lane = (ratePpm: number) => ({ channel: "ONLINE" as const, fixedCents: 0, installments: 1, method: "PIX" as const, ratePpm });

function setup(mode: SimpayCompanyFees["mode"], options: { failSave?: boolean } = {}) {
	const state = { saved: undefined as unknown };
	let provider: SimpayCompanyFees = {
		additiveFees: [],
		costs: [lane(9_800)],
		coverage: [],
		disabledLanes: [],
		lanes: [lane(10_000)],
		mode,
		underCovered: false,
		version: "1",
	};
	const client = {
		companyFees: async () => provider,
		saveCompanyFees: async (_: string, input: { lanes: SimpayCompanyFees["lanes"]; mode?: SimpayCompanyFees["mode"]; version: string }) => {
			if (options.failSave) throw new Error("SimIntPay unavailable");
			state.saved = input;
			provider = { ...provider, mode: input.mode ?? provider.mode, version: "2" };
			return provider;
		},
	};
	return { fees: new CompanyFees(client), state };
}

describe("company fees", () => {
	it("reads coverage and additive fees from SimIntPay", async () => {
		const { fees } = setup("BOTH");
		const result = await fees.get("c");
		expect(result.additiveFees).toEqual([]);
		expect(result.underCovered).toBe(false);
	});

	it("forwards additive edits together with the mode and version", async () => {
		const { fees, state } = setup("BOTH");
		await fees.update("c", { additiveFees: [{ associated: true, feeId: "f1" }], mode: "ADDITIVE_ONLY" });
		expect(state.saved).toMatchObject({ additiveFees: [{ associated: true, feeId: "f1" }], lanes: [], mode: "ADDITIVE_ONLY", version: "1" });
	});

	it("does not save when nothing changed", async () => {
		const { fees, state } = setup("BOTH");
		await fees.update("c", {});
		expect(state.saved).toBeUndefined();
	});

	it("propagates SimIntPay rejection", async () => {
		const { fees } = setup("BOTH", { failSave: true });
		await expect(fees.update("c", { mode: "SIMINTPAY_ONLY" })).rejects.toThrow("SimIntPay unavailable");
	});
});
