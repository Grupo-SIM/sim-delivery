import { describe, expect, it, mock, spyOn } from "bun:test";
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
			user: { findFirst: async () => null },
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
		const company = await new CreateCompany(prisma, { provisionPlatform: async () => ({ id: "platform", status: "PENDING_OWNER" }) }).execute({ name: "Bliss Cookie", slug: "bliss-cookie" });

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

		await expect(new CreateCompany(prisma, { provisionPlatform: async () => ({ id: "platform", status: "PENDING_OWNER" }) }).execute({ name: "New", slug: "taken" })).rejects.toThrow(
			"SLUG_TAKEN",
		);
	});
});

	describe("platform reservation", () => {
		it("reserves before any owner exists and resumes after provider failure", async () => {
			const { prisma, rows } = fakePrisma();
			const simpay = { provisionPlatform: mock(async () => ({ id: "platform", status: "PENDING_OWNER" as const })) };
			simpay.provisionPlatform.mockRejectedValueOnce(new Error("Provider unavailable"));
			const service = new CreateCompany(prisma, simpay);
			const input = { name: "Shop", slug: "shop" };
			await expect(service.execute(input)).rejects.toThrow("WITHDRAWAL_PROVIDER_ERROR");
			expect(rows).toHaveLength(1);
			expect(await service.execute(input)).toMatchObject(rows[0]);
			expect(rows).toHaveLength(1);
			expect(simpay.provisionPlatform).toHaveBeenCalledTimes(2);
			expect(simpay.provisionPlatform).toHaveBeenLastCalledWith({ externalMerchantId: "cmp_1", integrationKey: "sim-delivery_shop" }, "Shop");
		});
		it("does not retry a duplicate company after its first owner exists", async () => {
			const { prisma } = fakePrisma([{ id: "company", name: "Shop", slug: "shop", createdAt: new Date(), updatedAt: new Date() }]);
			spyOn(prisma.user, "findFirst").mockResolvedValue({ id: "owner" } as never);
			const simpay = { provisionPlatform: mock(async () => ({ id: "platform", status: "PENDING_OWNER" as const })) };
			await expect(new CreateCompany(prisma, simpay).execute({ name: "Shop", slug: "shop" })).rejects.toThrow("SLUG_TAKEN");
			expect(simpay.provisionPlatform).not.toHaveBeenCalled();
		});
	});
