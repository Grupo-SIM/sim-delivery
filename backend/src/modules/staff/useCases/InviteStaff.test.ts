import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { InviteStaff, type SignUpFn } from "./InviteStaff";

type UserRow = { id: string; email: string };

function fakePrisma(existingEmails: string[] = []) {
	const updates: Array<{ id: string; data: unknown }> = [];
	return {
		updates,
		prisma: {
			user: {
				findUnique: async ({ where }: { where: { email: string } }) =>
					existingEmails.includes(where.email) ? { id: "existing" } : null,
				update: async ({ data, where }: { data: { role: string }; where: { id: string } }) => {
					updates.push({ data, id: where.id });
					return {
						createdAt: new Date(),
						email: "new@staff.com",
						id: where.id,
						name: "New Staff",
						role: data.role,
					};
				},
			},
		} as unknown as PrismaInstance,
	};
}

const signUp: SignUpFn = async () => ({ user: { id: "u_new" } });

const baseInput = { email: "new@staff.com", name: "New Staff", password: "secret1", role: "manager" as const };

describe("InviteStaff", () => {
	it("creates a staff member scoped to the company", async () => {
		const { prisma, updates } = fakePrisma();
		const staff = await new InviteStaff(prisma, signUp).execute({ ...baseInput, companyId: "cmp_1" });

		expect(staff.role).toBe("manager");
		expect(updates[0]).toEqual({ data: { companyId: "cmp_1", role: "manager" }, id: "u_new" });
	});

	it("throws NO_COMPANY when the inviter has no tenant", async () => {
		const { prisma } = fakePrisma();
		await expect(new InviteStaff(prisma, signUp).execute({ ...baseInput, companyId: null })).rejects.toThrow(
			"NO_COMPANY",
		);
	});

	it("throws EMAIL_TAKEN when the email already exists", async () => {
		const { prisma } = fakePrisma(["new@staff.com"]);
		await expect(
			new InviteStaff(prisma, signUp).execute({ ...baseInput, companyId: "cmp_1" }),
		).rejects.toThrow("EMAIL_TAKEN");
	});
});
