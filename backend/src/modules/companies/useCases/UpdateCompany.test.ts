import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { UpdateCompany } from "./UpdateCompany";

type CompanyRow = { id: string; name: string; slug: string; variantKey: string | null; createdAt: Date; updatedAt: Date };

function fakePrisma(seed: CompanyRow[]) {
	const rows = [...seed];
	return {
		company: {
			findUnique: async ({ where }: { where: { id?: string; variantKey?: string } }) =>
				rows.find(row => (where.id ? row.id === where.id : row.variantKey === where.variantKey)) ?? null,
			update: async ({ data, where }: { data: Partial<CompanyRow>; where: { id: string } }) => {
				const row = rows.find(r => r.id === where.id)!;
				Object.assign(row, data);
				return row;
			},
		},
	} as unknown as PrismaInstance;
}

const base: CompanyRow = { createdAt: new Date(), id: "cmp_1", name: "Old", slug: "old", updatedAt: new Date(), variantKey: null };

describe("UpdateCompany", () => {
	it("updates name and links a variant", async () => {
		const prisma = fakePrisma([{ ...base }]);
		const updated = await new UpdateCompany(prisma).execute({ companyId: "cmp_1", name: "New", variantKey: "new-variant" });

		expect(updated.name).toBe("New");
		expect(updated.variantKey).toBe("new-variant");
	});

	it("unlinks a variant when passed null", async () => {
		const prisma = fakePrisma([{ ...base, variantKey: "old-variant" }]);
		const updated = await new UpdateCompany(prisma).execute({ companyId: "cmp_1", variantKey: null });

		expect(updated.variantKey).toBeNull();
	});

	it("throws COMPANY_NOT_FOUND for an unknown id", async () => {
		const prisma = fakePrisma([]);
		await expect(new UpdateCompany(prisma).execute({ companyId: "missing", name: "X" })).rejects.toThrow(
			"COMPANY_NOT_FOUND",
		);
	});

	it("throws VARIANT_TAKEN when the variant belongs to another company", async () => {
		const prisma = fakePrisma([
			{ ...base },
			{ ...base, id: "cmp_2", slug: "two", variantKey: "shared" },
		]);
		await expect(
			new UpdateCompany(prisma).execute({ companyId: "cmp_1", variantKey: "shared" }),
		).rejects.toThrow("VARIANT_TAKEN");
	});
});
