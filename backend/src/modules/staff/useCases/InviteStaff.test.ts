import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { InviteStaff, type RequestPasswordResetFn, type SignUpFn } from "./InviteStaff";

interface UserRow {
	id: string;
	email: string;
}

function fakePrisma(existingEmails: string[] = []) {
	const unitLinks: Array<{ unitId: string; userId: string }> = [];
	const updates: Array<{ id: string; data: unknown }> = [];
	return {
		prisma: {
			staffUnit: {
				createMany: async ({ data }: { data: Array<{ unitId: string; userId: string }> }) => {
					unitLinks.push(...data);
					return { count: data.length };
				},
			},
			unit: {
				findMany: async ({ where }: { where: { id: { in: string[] } } }) =>
					where.id.in.map(id => ({ id })),
			},
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
		updates,
	};
}

const signUp: SignUpFn = async () => ({ user: { id: "u_new" } });
const requestPasswordReset: RequestPasswordResetFn = async () => undefined;

const baseInput = {
	email: "new@staff.com",
	name: "New Staff",
	role: "manager" as const,
	unitIds: ["unit_1"],
};

describe("InviteStaff", () => {
	it("creates a staff member scoped to the company", async () => {
		const { prisma, updates } = fakePrisma();
		const staff = await new InviteStaff(prisma, signUp, requestPasswordReset).execute({
			...baseInput,
			companyId: "cmp_1",
		});

		expect(staff.role).toBe("manager");
		expect(updates[0]).toEqual({ data: { companyId: "cmp_1", role: "manager" }, id: "u_new" });
	});

	it("creates an additional owner scoped to the company", async () => {
		const { prisma, updates } = fakePrisma();
		const staff = await new InviteStaff(prisma, signUp, requestPasswordReset).execute({
			...baseInput,
			companyId: "cmp_1",
			role: "owner",
		});

		expect(staff.role).toBe("owner");
		expect(updates[0]).toEqual({ data: { companyId: "cmp_1", role: "owner" }, id: "u_new" });
	});

	it("throws NO_COMPANY when the inviter has no tenant", async () => {
		const { prisma } = fakePrisma();
		await expect(
			new InviteStaff(prisma, signUp, requestPasswordReset).execute({ ...baseInput, companyId: null }),
		).rejects.toThrow("NO_COMPANY");
	});

	it("requires at least one unit for every non-owner", async () => {
		const { prisma } = fakePrisma();
		await expect(
			new InviteStaff(prisma, signUp, requestPasswordReset).execute({
				...baseInput,
				companyId: "cmp_1",
				role: "attendant",
				unitIds: [],
			}),
		).rejects.toThrow("COURIER_UNIT_REQUIRED");
	});

	it("throws EMAIL_TAKEN when the email already exists", async () => {
		const { prisma } = fakePrisma(["new@staff.com"]);
		await expect(
			new InviteStaff(prisma, signUp, requestPasswordReset).execute({ ...baseInput, companyId: "cmp_1" }),
		).rejects.toThrow("EMAIL_TAKEN");
	});

	it("sends a password-definition email after creating the staff member", async () => {
		const { prisma } = fakePrisma();
		const calls: Array<{ body: { email: string; redirectTo: string } }> = [];
		const sendReset: RequestPasswordResetFn = async input => {
			calls.push(input);
		};

		await new InviteStaff(prisma, signUp, sendReset).execute({ ...baseInput, companyId: "cmp_1" });

		expect(calls).toEqual([
			{ body: { email: "new@staff.com", redirectTo: `${process.env.APP_URL}/reset-password` } },
		]);
	});
});
