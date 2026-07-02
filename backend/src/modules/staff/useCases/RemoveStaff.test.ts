import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { RemoveStaff } from "./RemoveStaff";

function fakePrisma(target: { id: string; companyId: string } | null) {
	const deleted: string[] = [];
	return {
		deleted,
		prisma: {
			user: {
				delete: async ({ where }: { where: { id: string } }) => {
					deleted.push(where.id);
					return {};
				},
				findFirst: async ({ where }: { where: { companyId: string | null; id: string } }) =>
					target && where.companyId === target.companyId && where.id === target.id ? target : null,
			},
		} as unknown as PrismaInstance,
	};
}

describe("RemoveStaff", () => {
	it("deletes an employee of the same company", async () => {
		const { deleted, prisma } = fakePrisma({ companyId: "cmp_1", id: "u1" });
		await new RemoveStaff(prisma).execute("cmp_1", "u1");
		expect(deleted).toEqual(["u1"]);
	});

	it("throws STAFF_NOT_FOUND for another company's user", async () => {
		const { prisma } = fakePrisma({ companyId: "cmp_1", id: "u1" });
		await expect(new RemoveStaff(prisma).execute("cmp_2", "u1")).rejects.toThrow("STAFF_NOT_FOUND");
	});
});
