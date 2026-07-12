import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { UpdateCompany } from "./UpdateCompany";

interface CompanyRow {
	id: string;
	name: string;
	slug: string;
	createdAt: Date;
	updatedAt: Date;
}

function fakePrisma(seed: CompanyRow[]) {
	const rows = [...seed];
	return {
		company: {
			findUnique: async ({ where }: { where: { id?: string; slug?: string } }) =>
				rows.find(row => (where.id ? row.id === where.id : row.slug === where.slug)) ?? null,
			update: async ({ data, where }: { data: Partial<CompanyRow>; where: { id: string } }) => {
				const row = rows.find(r => r.id === where.id)!;
				Object.assign(row, data);
				return row;
			},
		},
	} as unknown as PrismaInstance;
}

const base: CompanyRow = {
	createdAt: new Date(),
	id: "cmp_1",
	name: "Old",
	slug: "old",
	updatedAt: new Date(),
};

describe("UpdateCompany", () => {
	it("updates name and slug", async () => {
		const prisma = fakePrisma([{ ...base }]);
		const updated = await new UpdateCompany(prisma).execute({
			companyId: "cmp_1",
			name: "New",
			slug: "new-variant",
		});

		expect(updated.name).toBe("New");
		expect(updated.slug).toBe("new-variant");
	});

	it("throws COMPANY_NOT_FOUND for an unknown id", async () => {
		const prisma = fakePrisma([]);
		await expect(new UpdateCompany(prisma).execute({ companyId: "missing", name: "X" })).rejects.toThrow(
			"COMPANY_NOT_FOUND",
		);
	});

	it("throws SLUG_TAKEN when the slug belongs to another company", async () => {
		const prisma = fakePrisma([{ ...base }, { ...base, id: "cmp_2", slug: "shared" }]);
		await expect(
			new UpdateCompany(prisma).execute({ companyId: "cmp_1", slug: "shared" }),
		).rejects.toThrow("SLUG_TAKEN");
	});
});
