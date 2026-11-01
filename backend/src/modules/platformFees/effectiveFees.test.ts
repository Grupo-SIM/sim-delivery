import { afterEach, describe, expect, it } from "bun:test";
import type { SimpayCompanyFees } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { setFeeModeSource } from "./companyFeeMode";
import { listEffectiveFees } from "./effectiveFees";

const totals = (order: number, product: number) => ({
	order: { fixedValue: 0, percentageValue: order },
	product: { fixedValue: 0, percentageValue: product },
});

function setup(fees: Partial<SimpayCompanyFees>) {
	const written: string[] = [];
	const rows = [{ active: true, applicationScope: "order", companyOverrides: [] as Array<{ active: boolean }>, createdAt: new Date(), deletedAt: null, displayMode: "checkout_only", fixedValue: 0, id: "f1", name: "Taxa", percentageValue: 500 }];
	const prisma = {
		companySimpayIntegration: { findUnique: async () => ({ additiveFeeRevision: "1", additiveFeeOverridden: false }) },
		companyFeeOverride: {
			upsert: async ({ where }: { where: { feeId_companyId: { feeId: string } } }) => {
				written.push(where.feeId_companyId.feeId);
				rows[0]!.companyOverrides = [{ active: false }];
			},
		},
		platformFee: { findMany: async () => rows },
	} as unknown as PrismaInstance;
	setFeeModeSource({ companyFees: async () => ({ costs: [], disabledLanes: [], lanes: [], mode: "BOTH", version: "1", ...fees }) });
	return { prisma, written };
}

afterEach(() => setFeeModeSource(null));

describe("buyer surcharges", () => {
	it("uses SimIntPay effective totals as synthetic fees", async () => {
		const { prisma, written } = setup({ additiveFees: { effective: totals(500, 0), revision: "1" } });
		const fees = await listEffectiveFees(prisma, "c");
		expect(fees).toMatchObject([{ applicationScope: "order", percentageValue: 500 }]);
		expect(written).toEqual([]);
	});

	it("charges external actual rates without mutating associations on pricing", async () => {
		const { prisma, written } = setup({ additiveFees: { effective: totals(0, 200), revision: "2" } });
		expect(await listEffectiveFees(prisma, "c")).toMatchObject([{ applicationScope: "product", percentageValue: 200 }]);
		await listEffectiveFees(prisma, "c");
		expect(written).toEqual([]);
	});

	it("charges nothing in SIMINTPAY_ONLY and falls back to local fees for unknown totals", async () => {
		expect(await listEffectiveFees(setup({ mode: "SIMINTPAY_ONLY", additiveFees: { effective: totals(5, 0), revision: "1" } }).prisma, "c")).toEqual([]);
		expect(await listEffectiveFees(setup({}).prisma, "c")).toMatchObject([{ id: "f1", percentageValue: 500 }]);
	});
});
