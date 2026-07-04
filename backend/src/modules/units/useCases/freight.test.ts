import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { SimulateFreight } from "./SimulateFreight";

function makeFreightPrisma(opts: {
	company?: { id: string; variantKey: string } | null;
	unit?: { deliveryFee: number } | null;
} = {}) {
	const { company = { id: "cmp_1", variantKey: "demo" }, unit = { deliveryFee: 500 } } = opts;

	return {
		prisma: {
			company: {
				findUnique: async ({ where }: { where: { variantKey?: string } }) =>
					company?.variantKey === where.variantKey ? company : null,
			},
			unit: {
				findFirst: async ({ where }: { where: { companyId: string; id: string } }) =>
					company && unit && where.companyId === company.id ? unit : null,
			},
		} as unknown as PrismaInstance,
	};
}

describe("SimulateFreight", () => {
	it("throws NO_COMPANY when variantKey unknown", async () => {
		const { prisma } = makeFreightPrisma({ company: null });
		await expect(
			new SimulateFreight(prisma).execute({ unitId: "unit_1", variantKey: "unknown" }),
		).rejects.toThrow("NO_COMPANY");
	});

	it("throws UNIT_NOT_FOUND when unit not in company", async () => {
		const { prisma } = makeFreightPrisma({ unit: null });
		await expect(
			new SimulateFreight(prisma).execute({ unitId: "unit_missing", variantKey: "demo" }),
		).rejects.toThrow("UNIT_NOT_FOUND");
	});

	it("returns deliveryFee from the unit", async () => {
		const { prisma } = makeFreightPrisma();
		const result = await new SimulateFreight(prisma).execute({ unitId: "unit_1", variantKey: "demo" });
		expect(result).toEqual({ deliveryFee: 500 });
	});

	it("returns 0 when unit has no delivery fee", async () => {
		const { prisma } = makeFreightPrisma({ unit: { deliveryFee: 0 } });
		const result = await new SimulateFreight(prisma).execute({ unitId: "unit_1", variantKey: "demo" });
		expect(result).toEqual({ deliveryFee: 0 });
	});
});
