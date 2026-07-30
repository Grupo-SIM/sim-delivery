import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { UpdateStaffRole } from "./UpdateStaffRole";

function fakePrisma(target: { id: string; companyId: string } | null) {
	return {
		staffUnit: {
			deleteMany: async () => ({ count: 0 }),
		},
		user: {
			findFirst: async ({ where }: { where: { companyId: string | null; id: string; role: unknown } }) =>
				target && where.companyId === target.companyId && where.id === target.id ? target : null,
			update: async ({ data, where }: { data: { role: string }; where: { id: string } }) => ({
				createdAt: new Date(),
				email: "e@e.c",
				id: where.id,
				name: "Staff",
				role: data.role,
			}),
		},
	} as unknown as PrismaInstance;
}

describe("UpdateStaffRole", () => {
	it("changes the role of a staff member in the same company", async () => {
		const prisma = fakePrisma({ companyId: "cmp_1", id: "u1" });
		const staff = await new UpdateStaffRole(prisma).execute({
			companyId: "cmp_1",
			role: "kitchen",
			staffId: "u1",
		});

		expect(staff.role).toBe("kitchen");
	});

	it("throws STAFF_NOT_FOUND for another company's user", async () => {
		const prisma = fakePrisma({ companyId: "cmp_1", id: "u1" });
		await expect(
			new UpdateStaffRole(prisma).execute({ companyId: "cmp_2", role: "manager", staffId: "u1" }),
		).rejects.toThrow("STAFF_NOT_FOUND");
	});
});
