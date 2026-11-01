import { describe, expect, it } from "bun:test";
import { PaymentProviderError } from "@/shared/infra/paymentProviderError";
import type { SimpayAdditiveValue, SimpayCompanyFees } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { AdditiveFeeSync, sameAdditiveValues } from "./additiveFeeSync";

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

function setup(current: Partial<SimpayCompanyFees> & { notFound?: boolean } = {}) {
	const saved: unknown[] = [];
	const prisma = {
		company: { findMany: async () => [{ id: "c1" }, { id: "c2" }] },
		companyFeeOverride: { findMany: async () => [{ companyId: "c1" }] },
		platformFee: {
			findMany: async ({ include }: { include: { companyOverrides: { where: { companyId: string } } } }) =>
				fees.map(fee => ({ ...fee, companyOverrides: fee.companyOverrides.filter(o => o.companyId === include.companyOverrides.where.companyId) })),
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
	return { saved, sync: new AdditiveFeeSync(prisma, provider) };
}

describe("additive fee resolve and push", () => {
	it("resolves active fees with overrides applied and drops disabled ones", async () => {
		const { sync } = setup();
		expect(await sync.resolve("c1")).toEqual([
			{ applicationScope: "order", externalId: "a_inherited", fixedValue: 50, name: "Taxa", percentageValue: 0 },
			{ applicationScope: "product", externalId: "b_overridden", fixedValue: 100, name: "Serviço", percentageValue: 350 },
		]);
	});

	it("pushes a full replacement echoing mode, disabled lanes and version", async () => {
		const { saved, sync } = setup();
		const { result } = await sync.push("c1");
		expect(result).toBe("pushed");
		expect(saved[0]).toMatchObject({ disabledLanes: ["CREDIT_CARD/12"], lanes: [], mode: "BOTH", version: "7" });
		expect((saved[0] as { additiveFees: SimpayAdditiveValue[] }).additiveFees).toHaveLength(2);
	});

	it("does not push when SimIntPay already holds the same values", async () => {
		const { saved, sync } = setup();
		const values = await sync.resolve("c1");
		const unchanged = setup({ additiveFees: [...values].reverse() });
		expect((await unchanged.sync.push("c1")).result).toBe("skipped-unchanged");
		expect(unchanged.saved).toHaveLength(0);
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

	it("clears SimIntPay when nothing resolves", async () => {
		const { saved, sync } = setup({ additiveFees: [{ applicationScope: "order", externalId: "old", fixedValue: 1, name: "Old", percentageValue: 0 }] });
		const empty = new AdditiveFeeSync({ platformFee: { findMany: async () => [] } } as unknown as PrismaInstance, {
			companyFees: async () => ({ additiveFees: [{ applicationScope: "order", externalId: "old", fixedValue: 1, name: "Old", percentageValue: 0 }], costs: [], disabledLanes: [], lanes: [], mode: "BOTH", version: "1" }),
			saveCompanyFees: async (_: string, input: unknown) => {
				saved.push(input);
				return {} as SimpayCompanyFees;
			},
		});
		await empty.push("c1");
		expect(saved[0]).toMatchObject({ additiveFees: [] });
		expect(sync).toBeDefined();
	});

	it("resyncs every company except those that disabled the fee, isolating failures", async () => {
		const { sync } = setup();
		expect(await sync.companiesAffectedBy("c_disabled")).toEqual(["c2"]);
		expect(await sync.companiesAffectedBy("c_disabled", { all: true })).toEqual(["c1", "c2"]);
		const outcomes = await sync.pushMany(["c1", "c2"], { dryRun: true });
		expect(outcomes.map(o => o.result)).toEqual(["pushed", "pushed"]);
	});

	it("compares lists order-insensitively", () => {
		const a = { applicationScope: "order" as const, externalId: "1", fixedValue: 1, name: "A", percentageValue: 0 };
		const b = { ...a, externalId: "2" };
		expect(sameAdditiveValues([a, b], [b, a])).toBe(true);
		expect(sameAdditiveValues([a], [b])).toBe(false);
		expect(sameAdditiveValues(undefined, [])).toBe(true);
	});
});
