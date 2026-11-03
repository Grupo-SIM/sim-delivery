import { describe, expect, it } from "bun:test";
import type { SimpayCompanyFees } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CompanyFees } from "./CompanyFees";

const lane = (ratePpm: number) => ({ channel: "ONLINE" as const, fixedCents: 0, installments: 1, method: "PIX" as const, ratePpm });

function setup(mode: string, options: { failSave?: boolean; provider?: Partial<SimpayCompanyFees>; revision?: string | null } = {}) {
	const state = { mode, saved: undefined as unknown, integration: { additiveFeeOverridden: false, additiveFeeRevision: options.revision ?? null as string | null }, updates: [] as unknown[], locks: 0 };
	const zero = { order: { fixedValue: 0, percentageValue: 0 }, product: { fixedValue: 0, percentageValue: 0 } };
	let provider: SimpayCompanyFees = { additiveFees: { effective: zero, revision: "0" }, costs: [lane(9_800)], disabledLanes: [], lanes: [lane(10_000)], mode: mode as SimpayCompanyFees["mode"], version: "1", ...options.provider };
	const prisma = {
		$transaction: async (run: (tx: unknown) => Promise<unknown>) => run(prisma),
		$executeRaw: async () => { state.locks++; return 0; },
		companySimpayIntegration: {
			findUnique: async () => ({ ...state.integration }),
			updateMany: async ({ where, data }: { where: { additiveFeeRevision: string | null }; data: Partial<typeof state.integration> }) => {
				state.updates.push({ where, data });
				if (where.additiveFeeRevision !== state.integration.additiveFeeRevision) return { count: 0 };
				Object.assign(state.integration, data);
				return { count: 1 };
			},
		},
		companyPlatformFee: { deleteMany: async () => ({ count: 0 }) },
		platformFee: { findMany: async () => [] },
	} as unknown as PrismaInstance;
	const client = {
		companyFees: async () => provider,
		saveCompanyFees: async (_: string, input: { lanes: SimpayCompanyFees["lanes"]; mode?: SimpayCompanyFees["mode"]; version: string; additiveFees?: NonNullable<SimpayCompanyFees["additiveFees"]>["effective"]; additiveRevision?: string }) => {
			if (options.failSave) throw new Error("SimIntPay unavailable");
			if (input.additiveFees && input.additiveRevision !== provider.additiveFees!.revision) throw new Error("revision conflict");
			state.saved = input;
			provider = { ...provider, additiveFees: input.additiveFees ? { effective: input.additiveFees, revision: String(Number(provider.additiveFees!.revision) + 1) } : provider.additiveFees, lanes: input.lanes.length ? input.lanes : provider.lanes, mode: input.mode ?? provider.mode, version: "2" };
			state.mode = provider.mode;
			return provider;
		},
	};
	return { fees: new CompanyFees(prisma, client), state };
}

describe("company fees", () => {
	it("uses the upstream acquiring floor including installment interest for reads", async () => {
		// Upstream folds 4% acquiring + 6% installment interest into the existing ratePpm contract.
		const cost = { ...lane(100_000), installments: 12, method: "CREDIT_CARD" as const };
		const { fees, state } = setup("SIMINTPAY_ONLY", { provider: { costs: [cost], lanes: [{ ...cost, ratePpm: 90_000 }] } });
		const result = await fees.get("interest-company");
		expect(result.underCovered).toBe(true);
		expect(result.coverage[0]).toMatchObject({ cost: { ratePpm: 100_000 }, rateShortfallPpm: 10_000 });

		const saved = await fees.update("interest-company", { simintpay: { lanes: [cost], version: "1" } });
		expect(saved.underCovered).toBe(false);
		expect(saved.coverage[0]).toMatchObject({ covered: { ratePpm: 100_000 }, rateShortfallPpm: 0 });
		expect(state.saved).toMatchObject({ lanes: [cost] });
	});

	it("saves covered SimIntPay fees together with the mode", async () => {
		const { fees, state } = setup("BOTH");
		const result = await fees.update("c", { simintpay: { lanes: [lane(12_000)], version: "1" } });
		expect(result.underCovered).toBe(false);
		expect(result.simintpay.version).toBe("2");
		expect(state.saved).toMatchObject({ mode: "BOTH", version: "1" });
	});

	it("pushes a mode-only change to SimIntPay without touching its lanes", async () => {
		const { fees, state } = setup("BOTH");
		const result = await fees.update("c", { mode: "SIMINTPAY_ONLY" });
		expect(state.saved).toMatchObject({ additiveFees: expect.anything(), lanes: [], mode: "SIMINTPAY_ONLY", version: "1" });
		expect(state.mode).toBe("SIMINTPAY_ONLY");
		expect(result.mode).toBe("SIMINTPAY_ONLY");
		expect(result.extras).toEqual([]);
	});

	it("keeps the local mode when SimIntPay rejects the change", async () => {
		const { fees, state } = setup("BOTH", { failSave: true });
		await expect(fees.update("c", { mode: "SIMINTPAY_ONLY" })).rejects.toThrow("SimIntPay unavailable");
		expect(state.mode).toBe("BOTH");
	});

	it("reports the SimIntPay override, hides local extras and computes coverage from the effective total", async () => {
		const totals = (percentageValue: number) => ({ order: { fixedValue: 0, percentageValue }, product: { fixedValue: 0, percentageValue: 0 } });
		const { fees } = setup("BOTH", {
			provider: { additiveFees: { effective: totals(0), revision: "2" }, costs: [lane(9_800)], lanes: [lane(0)] },
		});
		const result = await fees.get("c");
		expect(result.additiveOverride).toEqual(totals(0));
		expect(result.effectiveTotals).toEqual(totals(0));
		expect(result.extras).toEqual([]);
		expect(result.underCovered).toBe(true);
	});

	it("does not push Delivery totals while overridden", async () => {
		const totals = { order: { fixedValue: 0, percentageValue: 100 }, product: { fixedValue: 0, percentageValue: 0 } };
		const { fees, state } = setup("BOTH", { provider: { additiveFees: { effective: totals, revision: "2" } } });
		await fees.update("c", { mode: "SIMINTPAY_ONLY" });
		expect((state.saved as { additiveFees?: unknown }).additiveFees).toBeUndefined();
	});
	it("acknowledges a successful additive save with its new revision", async () => {
		const { fees, state } = setup("BOTH");
		await fees.update("c", { mode: "SIMINTPAY_ONLY" });
		expect(state.integration.additiveFeeRevision).toBe("1");
		expect(state.locks).toBe(1);
	});

	it("does not acknowledge a failed provider save", async () => {
		const { fees, state } = setup("BOTH", { failSave: true });
		await expect(fees.update("c", { mode: "SIMINTPAY_ONLY" })).rejects.toThrow();
		expect(state.integration.additiveFeeRevision).toBeNull();
		expect(state.updates).toHaveLength(0);
	});

});
