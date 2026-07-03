import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ListPublicUnits } from "./ListPublicUnits";

function prismaWith(
	company: { id: string; variantKey: string } | null,
	units: Array<{ companyId: string; id: string; isOpenManual: boolean | null }> = [],
) {
	return {
		company: {
			findUnique: async ({ where }: { where: { variantKey: string } }) =>
				company && company.variantKey === where.variantKey ? company : null,
		},
		unit: {
			findMany: async ({ where }: { where: { companyId: string } }) =>
				units.filter(unit => unit.companyId === where.companyId).map(unit => ({ ...unit, hours: [] })),
		},
	} as unknown as PrismaInstance;
}

describe("ListPublicUnits", () => {
	it("returns [] without a variantKey", async () => {
		const prisma = prismaWith({ id: "c1", variantKey: "bliss" });
		expect(await new ListPublicUnits(prisma).execute(undefined)).toEqual([]);
	});

	it("returns [] for an unknown variantKey", async () => {
		const prisma = prismaWith({ id: "c1", variantKey: "bliss" });
		expect(await new ListPublicUnits(prisma).execute("nope")).toEqual([]);
	});

	it("returns only the matched company's units with computed status", async () => {
		const prisma = prismaWith({ id: "c1", variantKey: "bliss" }, [
			{ companyId: "c1", id: "u1", isOpenManual: true },
			{ companyId: "c2", id: "u2", isOpenManual: true },
		]);
		const result = await new ListPublicUnits(prisma).execute("bliss");
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ id: "u1", isOpenNow: true });
	});
});
