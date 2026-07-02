import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { UpdateStaffLevel } from "./UpdateStaffLevel";

function fakePrisma(target: { id: string; companyId: string } | null) {
	return {
		user: {
			findFirst: async ({ where }: { where: { companyId: string | null; id: string; role: string } }) =>
				target && where.companyId === target.companyId && where.id === target.id ? target : null,
			update: async ({ data, where }: { data: { level: string }; where: { id: string } }) => ({
				createdAt: new Date(),
				email: "e@e.c",
				id: where.id,
				level: data.level,
				name: "Staff",
				role: "employee",
			}),
		},
	} as unknown as PrismaInstance;
}

describe("UpdateStaffLevel", () => {
	it("changes the level of an employee in the same company", async () => {
		const prisma = fakePrisma({ companyId: "cmp_1", id: "u1" });
		const staff = await new UpdateStaffLevel(prisma).execute({ companyId: "cmp_1", level: "kitchen", staffId: "u1" });

		expect(staff.level).toBe("kitchen");
	});

	it("throws STAFF_NOT_FOUND for another company's user", async () => {
		const prisma = fakePrisma({ companyId: "cmp_1", id: "u1" });
		await expect(
			new UpdateStaffLevel(prisma).execute({ companyId: "cmp_2", level: "manager", staffId: "u1" }),
		).rejects.toThrow("STAFF_NOT_FOUND");
	});
});
