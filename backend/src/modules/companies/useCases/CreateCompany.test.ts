import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CreateCompany } from "./CreateCompany";

interface CompanyRow {
	id: string;
	name: string;
	slug: string;
	createdAt: Date;
	updatedAt: Date;
}

function fakePrisma(seed: CompanyRow[] = []) {
	const rows = [...seed];
	return {
		prisma: {
			company: {
				create: async ({ data }: { data: { name: string; slug: string } }) => {
					const row: CompanyRow = {
						createdAt: new Date(),
						id: `cmp_${rows.length + 1}`,
					name: data.name,
					slug: data.slug,
					updatedAt: new Date(),
					};
					rows.push(row);
					return row;
				},
				findUnique: async ({ where }: { where: { slug: string } }) =>
					rows.find(row => row.slug === where.slug) ?? null,
			},
		} as unknown as PrismaInstance,
		rows,
	};
}

describe("CreateCompany", () => {
	it("creates a company with a fresh slug", async () => {
		const { prisma, rows } = fakePrisma();
		const company = await new CreateCompany(prisma).execute({ name: "Bliss Cookie", slug: "bliss-cookie" });

		expect(company.slug).toBe("bliss-cookie");
		expect(rows).toHaveLength(1);
	});

	it("rejects a duplicate slug with SLUG_TAKEN", async () => {
		const { prisma } = fakePrisma([
			{
				createdAt: new Date(),
				id: "cmp_1",
				name: "Existing",
				slug: "taken",
				updatedAt: new Date(),
			},
		]);

		await expect(new CreateCompany(prisma).execute({ name: "New", slug: "taken" })).rejects.toThrow(
			"SLUG_TAKEN",
		);
	});
});
