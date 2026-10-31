import { describe, expect, it } from "bun:test";
import type { SimpayCompanyFees } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CompanyFees } from "./CompanyFees";

const lane = (ratePpm: number) => ({ channel: "ONLINE" as const, fixedCents: 0, installments: 1, method: "PIX" as const, ratePpm });

function setup(mode: string, options: { failSave?: boolean } = {}) {
	const state = { mode, saved: undefined as unknown };
	let provider: SimpayCompanyFees = { costs: [lane(9_800)], disabledLanes: [], lanes: [lane(10_000)], mode: mode as SimpayCompanyFees["mode"], version: "1" };
	const prisma = {
		platformFee: { findMany: async () => [] },
	} as unknown as PrismaInstance;
	const client = {
		companyFees: async () => provider,
		saveCompanyFees: async (_: string, input: { lanes: SimpayCompanyFees["lanes"]; mode?: SimpayCompanyFees["mode"]; version: string }) => {
			if (options.failSave) throw new Error("SimIntPay unavailable");
			state.saved = input;
			provider = { ...provider, lanes: input.lanes.length ? input.lanes : provider.lanes, mode: input.mode ?? provider.mode, version: "2" };
			state.mode = provider.mode;
			return provider;
		},
	};
	return { fees: new CompanyFees(prisma, client), state };
}

describe("company fees", () => {
	it("rejects SimIntPay fees below the acquirer cost and does not save them", async () => {
		const { fees, state } = setup("BOTH");
		await expect(fees.update("c", { simintpay: { lanes: [lane(1_000)], version: "1" } })).rejects.toThrow();
		expect(state.saved).toBeUndefined();
	});

	it("saves covered SimIntPay fees together with the mode", async () => {
		const { fees, state } = setup("BOTH");
		const result = await fees.update("c", { simintpay: { lanes: [lane(12_000)], version: "1" } });
		expect(result.underCovered).toBe(false);
		expect(result.simintpay.version).toBe("2");
		expect(state.saved).toMatchObject({ mode: "BOTH", version: "1" });
	});

	it("rejects switching to ADDITIVE_ONLY when no surcharge covers the cost", async () => {
		const { fees, state } = setup("BOTH");
		await expect(fees.update("c", { mode: "ADDITIVE_ONLY" })).rejects.toThrow();
		expect(state.mode).toBe("BOTH");
		expect(state.saved).toBeUndefined();
	});

	it("pushes a mode-only change to SimIntPay without touching its lanes", async () => {
		const { fees, state } = setup("BOTH");
		const result = await fees.update("c", { mode: "SIMINTPAY_ONLY" });
		expect(state.saved).toMatchObject({ lanes: [], mode: "SIMINTPAY_ONLY", version: "1" });
		expect(state.mode).toBe("SIMINTPAY_ONLY");
		expect(result.mode).toBe("SIMINTPAY_ONLY");
		expect(result.extras).toEqual([]);
	});

	it("keeps the local mode when SimIntPay rejects the change", async () => {
		const { fees, state } = setup("BOTH", { failSave: true });
		await expect(fees.update("c", { mode: "SIMINTPAY_ONLY" })).rejects.toThrow("SimIntPay unavailable");
		expect(state.mode).toBe("BOTH");
	});
});
