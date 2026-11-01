import { describe, expect, it } from "bun:test";
import { PaymentProviderError } from "@/shared/infra/paymentProviderError";
import type { SimpayAdditiveFees, SimpayAdditiveTotals, SimpayCompanyFees } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { AdditiveFeeSync } from "./additiveFeeSync";
import { sameTotals } from "./additiveTotals";

const fees = [
	{
		active: true,
		applicationScope: "product",
		companyOverrides: [{ active: true, companyId: "c1", fixedOverride: null, percentageOverride: 350 }],
		displayMode: "embedded",
		fixedValue: 100,
		id: "b_overridden",
		name: "Serviço",
		percentageValue: 200,
	},
	{
		active: true,
		applicationScope: "order",
		companyOverrides: [{ active: false, companyId: "c1", fixedOverride: null, percentageOverride: null }],
		displayMode: "checkout_only",
		fixedValue: 100,
		id: "c_disabled",
		name: "Operação",
		percentageValue: 0,
	},
	{
		active: true,
		applicationScope: "order",
		companyOverrides: [],
		displayMode: "checkout_only",
		fixedValue: 50,
		id: "a_inherited",
		name: "Taxa",
		percentageValue: 0,
	},
];

const totals = (order: [number, number], product: [number, number]): SimpayAdditiveTotals => ({
	order: { fixedValue: order[1], percentageValue: order[0] },
	product: { fixedValue: product[1], percentageValue: product[0] },
});
const zero = totals([0, 0], [0, 0]);
// c1 resolves to order 0% + R$0,50 and product 3,5% + R$1,00.
const c1Totals = totals([0, 50], [350, 100]);

function setup(current: Partial<SimpayCompanyFees> & { notFound?: boolean } = {}, options: { revision?: string | null; failSave?: boolean; empty?: boolean } = {}) {
	const saved: unknown[] = [];
	const overrides: Array<{ active: boolean; feeId: string }> = [];
	const state = {
		fees: options.empty ? [] : fees.map(fee => ({ ...fee, companyOverrides: fee.companyOverrides.map(override => ({ ...override })) })),
		integration: { additiveFeeOverridden: false, additiveFeeRevision: options.revision ?? null as string | null },
		updates: [] as unknown[],
		locks: 0,
	};
	const prisma = {
		$transaction: async (run: (tx: unknown) => Promise<unknown>) => run(prisma),
		$queryRaw: async () => { state.locks++; return []; },
		companySimpayIntegration: {
			findUnique: async () => ({ ...state.integration }),
			updateMany: async ({ where, data }: { where: { additiveFeeRevision: string | null; additiveFeeOverridden?: boolean }; data: Partial<typeof state.integration> }) => {
				state.updates.push({ where, data });
				if (where.additiveFeeRevision !== state.integration.additiveFeeRevision || (where.additiveFeeOverridden !== undefined && where.additiveFeeOverridden !== state.integration.additiveFeeOverridden)) return { count: 0 };
				Object.assign(state.integration, data);
				return { count: 1 };
			},
		},
		company: { findMany: async () => [{ id: "c1" }, { id: "c2" }] },
		companyFeeOverride: {
			findMany: async () => [{ companyId: "c1" }],
			upsert: async ({ create, where }: { create: { active: boolean }; where: { feeId_companyId: { companyId: string; feeId: string } } }) => {
				const { companyId, feeId } = where.feeId_companyId;
				const fee = state.fees.find(item => item.id === feeId)!;
				const existing = fee.companyOverrides.find(item => item.companyId === companyId);
				if (existing) existing.active = false;
				else fee.companyOverrides.push({ ...create, companyId, fixedOverride: null, percentageOverride: null });
				overrides.push({ active: false, feeId });
			},
		},
		platformFee: {
			findMany: async ({ include }: { include: { companyOverrides: { where: { companyId: string } } } }) =>
				state.fees.map(fee => ({ ...fee, companyOverrides: fee.companyOverrides.filter(o => o.companyId === include.companyOverrides.where.companyId) })),
		},
	} as unknown as PrismaInstance;
	let providerFees = { additiveFees: additive(zero), costs: [], disabledLanes: ["CREDIT_CARD/12"], lanes: [], mode: "BOTH", version: "7", ...current } as SimpayCompanyFees;
	const provider = {
		companyFees: async () => {
			if (current.notFound) throw new PaymentProviderError("Simpay", "nf", 404);
			return providerFees;
		},
		saveCompanyFees: async (_: string, input: { additiveFees?: SimpayAdditiveTotals; additiveRevision?: string }) => {
			if (options.failSave || input.additiveRevision !== providerFees.additiveFees!.revision) throw new PaymentProviderError("Simpay", "revision conflict", 409);
			saved.push(input);
			providerFees = { ...providerFees, additiveFees: additive(input.additiveFees!, String(Number(providerFees.additiveFees!.revision) + 1)) };
			return providerFees;
		},
	};
	return { overrides, saved, state, sync: new AdditiveFeeSync(prisma, provider) };
}

const additive = (effective: SimpayAdditiveTotals, revision = "0"): SimpayAdditiveFees => ({ effective, revision });

describe("additive fee totals and push", () => {
	it("sums active fees per scope with overrides applied and drops disabled ones", async () => {
		const { sync } = setup();
		expect(await sync.resolve("c1")).toEqual(c1Totals);
	});

	it("pushes the sums echoing mode, disabled lanes and version", async () => {
		const { saved, sync } = setup();
		const { result } = await sync.push("c1");
		expect(result).toBe("pushed");
		expect(saved[0]).toMatchObject({ additiveFees: c1Totals, disabledLanes: ["CREDIT_CARD/12"], lanes: [], mode: "BOTH", version: "7" });
	});

	it("does not push when SimIntPay already holds the same Delivery total", async () => {
		const { saved, sync } = setup({ additiveFees: additive(c1Totals) });
		expect((await sync.push("c1")).result).toBe("skipped-unchanged");
		expect(saved).toHaveLength(0);
	});

	it("dry run reports the change without saving", async () => {
		const { saved, state, sync } = setup();
		expect((await sync.push("c1", { dryRun: true })).result).toBe("pushed");
		expect(saved).toHaveLength(0);
		expect(state.updates).toHaveLength(0);
		expect(state.integration.additiveFeeRevision).toBeNull();
	});

	it("skips companies SimIntPay does not know", async () => {
		const { saved, sync } = setup({ notFound: true });
		expect((await sync.push("c1")).result).toBe("skipped-unregistered");
		expect(saved).toHaveLength(0);
	});

	it("pushes zeros when nothing resolves", async () => {
		const { saved, sync } = setup({ additiveFees: additive(c1Totals, "1") }, { empty: true, revision: "1" });
		await sync.push("c1");
		expect(saved[0]).toMatchObject({ additiveFees: zero });
	});

	it("never pushes over a SimIntPay override and undoes associations idempotently", async () => {
		const { overrides, saved, sync } = setup({ additiveFees: additive(totals([100, 0], [0, 25]), "2") }, { revision: "1" });
		expect((await sync.push("c1")).result).toBe("skipped-overridden");
		expect(saved).toHaveLength(0);
		// a_inherited and b_overridden applied to c1; c_disabled already off.
		expect(overrides.map(o => o.feeId).sort()).toEqual(["a_inherited", "b_overridden"]);
		expect(await sync.resolve("c1")).toEqual(zero);
		await sync.push("c1");
		expect(overrides).toHaveLength(2);
		expect(saved).toHaveLength(0);
	});

	it("dry run leaves associations untouched while overridden", async () => {
		const { overrides, sync } = setup({ additiveFees: additive(zero, "2") }, { revision: "1" });
		expect((await sync.push("c1", { dryRun: true })).result).toBe("skipped-overridden");
		expect(overrides).toHaveLength(0);
	});

	it("resyncs every company except those that disabled the fee, isolating failures", async () => {
		const { sync } = setup();
		expect(await sync.companiesAffectedBy("c_disabled")).toEqual(["c2"]);
		expect(await sync.companiesAffectedBy("c_disabled", { all: true })).toEqual(["c1", "c2"]);
		const outcomes = await sync.pushMany(["c1", "c2"], { dryRun: true });
		expect(outcomes.map(o => o.result)).toEqual(["pushed", "pushed"]);
	});

	it("detects an external revision even when the effective total is unchanged", async () => {
		const { sync, state, overrides, saved } = setup({ additiveFees: additive(c1Totals, "2") }, { revision: "1" });
		expect((await sync.push("c1")).result).toBe("skipped-overridden");
		expect(state.integration).toEqual({ additiveFeeOverridden: true, additiveFeeRevision: "1" });
		expect(overrides).toHaveLength(2);
		expect(saved).toHaveLength(0);
	});

	it("protects unknown provider revisions without suppressing associations", async () => {
		const { sync, state, overrides, saved } = setup({ additiveFees: additive(c1Totals, "3") });
		expect((await sync.push("c1")).result).toBe("skipped-overridden");
		expect(await sync.resolve("c1")).toEqual(c1Totals);
		expect(overrides).toHaveLength(0);
		expect(state.updates).toHaveLength(0);
		expect(saved).toHaveLength(0);
	});

	it("acknowledges the incremented provider revision under the transaction lock", async () => {
		const { sync, state } = setup();
		await sync.push("c1");
		expect(state.locks).toBe(1);
		expect(state.integration.additiveFeeRevision).toBe("1");
	});

	it("does not acknowledge provider CAS conflicts", async () => {
		const { sync, state, saved } = setup({}, { failSave: true });
		await expect(sync.push("c1")).rejects.toThrow("revision conflict");
		expect(state.updates).toHaveLength(0);
		expect(state.integration.additiveFeeRevision).toBeNull();
		expect(saved).toHaveLength(0);
	});

	it("compares totals field by field", () => {
		expect(sameTotals(c1Totals, c1Totals)).toBe(true);
		expect(sameTotals(zero, c1Totals)).toBe(false);
		expect(sameTotals(undefined, zero)).toBe(false);
	});
});
