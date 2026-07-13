import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { DeleteCompany } from "./DeleteCompany";

function fakePrisma(existingIds: string[]) {
	const rows = new Set(existingIds);
	return {
		company: {
			delete: async ({ where }: { where: { id: string } }) => {
				rows.delete(where.id);
			},
			findUnique: async ({ where }: { where: { id: string } }) =>
				rows.has(where.id) ? { id: where.id } : null,
		},
	} as unknown as PrismaInstance;
}

describe("DeleteCompany", () => {
	it("deletes an existing company", async () => {
		const prisma = fakePrisma(["cmp_1"]);

		await new DeleteCompany(prisma).execute("cmp_1");

		await expect(new DeleteCompany(prisma).execute("cmp_1")).rejects.toThrow("COMPANY_NOT_FOUND");
	});

	it("throws COMPANY_NOT_FOUND for an unknown id", async () => {
		await expect(new DeleteCompany(fakePrisma([])).execute("missing")).rejects.toThrow("COMPANY_NOT_FOUND");
	});
});
