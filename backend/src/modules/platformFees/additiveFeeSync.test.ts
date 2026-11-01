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

function setup(current: Partial<SimpayCompanyFees> & { notFound?: boolean } = {}) {
	const saved: unknown[] = [];
	const overrides: Array<{ active: boolean; feeId: string }> = [];
	const state = { fees: fees.map(fee => ({ ...fee, companyOverrides: [...fee.companyOverrides] })) };
	const prisma = {
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
	const provider = {
		companyFees: async () => {
			if (current.notFound) throw new PaymentProviderError("Simpay", "nf", 404);
			return { costs: [], disabledLanes: ["CREDIT_CARD/12"], lanes: [], mode: "BOTH", version: "7", ...current } as SimpayCompanyFees;
		},
		saveCompanyFees: async (_: string, input: unknown) => {
			saved.push(input);
			return {} as SimpayCompanyFees;
		},
	};
	return { overrides, saved, sync: new AdditiveFeeSync(prisma, provider) };
}

const additive = (delivery: SimpayAdditiveTotals, override: SimpayAdditiveTotals | null = null): SimpayAdditiveFees => ({
	delivery,
	effective: override ?? delivery,
	override,
});

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
		const { saved, sync } = setup();
		expect((await sync.push("c1", { dryRun: true })).result).toBe("pushed");
		expect(saved).toHaveLength(0);
	});

	it("skips companies SimIntPay does not know", async () => {
		const { saved, sync } = setup({ notFound: true });
		expect((await sync.push("c1")).result).toBe("skipped-unregistered");
		expect(saved).toHaveLength(0);
	});

	it("pushes zeros when nothing resolves", async () => {
		const saved: unknown[] = [];
		const empty = new AdditiveFeeSync({ platformFee: { findMany: async () => [] } } as unknown as PrismaInstance, {
			companyFees: async () => ({ additiveFees: additive(c1Totals), costs: [], disabledLanes: [], lanes: [], mode: "BOTH", version: "1" }),
			saveCompanyFees: async (_: string, input: unknown) => {
				saved.push(input);
				return {} as SimpayCompanyFees;
			},
		});
		await empty.push("c1");
		expect(saved[0]).toMatchObject({ additiveFees: zero });
	});

	it("never pushes over a SimIntPay override and undoes associations idempotently", async () => {
		const { overrides, saved, sync } = setup({ additiveFees: additive(c1Totals, totals([100, 0], [0, 25])) });
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
		const { overrides, sync } = setup({ additiveFees: additive(c1Totals, zero) });
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

	it("compares totals field by field", () => {
		expect(sameTotals(c1Totals, c1Totals)).toBe(true);
		expect(sameTotals(zero, c1Totals)).toBe(false);
		expect(sameTotals(undefined, zero)).toBe(false);
	});
});
