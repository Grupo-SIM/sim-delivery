import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { RemoveStaff } from "./RemoveStaff";

function fakePrisma(target: { id: string; companyId: string; role?: string } | null) {
	const deleted: string[] = [];
	return {
		deleted,
		prisma: {
			user: {
				delete: async ({ where }: { where: { id: string } }) => {
					deleted.push(where.id);
					return {};
				},
				findFirst: async ({
					where,
				}: {
					where: { companyId?: string | null; id: string; role: { in: string[] } };
				}) =>
					target &&
					where.id === target.id &&
					where.role.in.includes(target.role ?? "manager") &&
					(where.companyId === undefined || where.companyId === target.companyId)
						? target
						: null,
			},
		} as unknown as PrismaInstance,
	};
}

describe("RemoveStaff", () => {
	it("deletes a staff member of the same company", async () => {
		const { deleted, prisma } = fakePrisma({ companyId: "cmp_1", id: "u1" });
		await new RemoveStaff(prisma).execute("cmp_1", "u1");
		expect(deleted).toEqual(["u1"]);
	});

	it("allows a global superAdmin to delete staff from another company", async () => {
		const { deleted, prisma } = fakePrisma({ companyId: "cmp_1", id: "u1" });
		await new RemoveStaff(prisma).execute(null, "u1", true);
		expect(deleted).toEqual(["u1"]);
	});

	it("throws STAFF_NOT_FOUND for another company's user", async () => {
		const { prisma } = fakePrisma({ companyId: "cmp_1", id: "u1" });
		await expect(new RemoveStaff(prisma).execute("cmp_2", "u1")).rejects.toThrow("STAFF_NOT_FOUND");
	});

	it("does not allow a superAdmin to delete an owner", async () => {
		const { prisma } = fakePrisma({ companyId: "cmp_1", id: "u1", role: "owner" });
		await expect(new RemoveStaff(prisma).execute(null, "u1", true)).rejects.toThrow("STAFF_NOT_FOUND");
	});
});
