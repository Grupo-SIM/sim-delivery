import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { SignUpFn } from "@/modules/staff/useCases/InviteStaff";
import type { PrismaInstance } from "@/shared/infra/sql";
import { SeedAdmin } from "./SeedAdmin";

type UserRow = { id: string; email: string };

function fakePrisma(existing: UserRow[] = []) {
	const updates: Array<{ id: string; data: unknown }> = [];
	return {
		updates,
		prisma: {
			user: {
				findUnique: async ({ where }: { where: { email: string } }) =>
					existing.find(user => user.email === where.email) ?? null,
				update: async ({ data, where }: { data: unknown; where: { id: string } }) => {
					updates.push({ data, id: where.id });
					return { id: where.id, ...(data as object) };
				},
			},
		} as unknown as PrismaInstance,
	};
}

const signUp: SignUpFn = async () => ({ user: { id: "u_new" } });

const originalEnv = { ...process.env };

beforeEach(() => {
	delete process.env.ADMIN_EMAIL;
	delete process.env.ADMIN_NAME;
	delete process.env.ADMIN_PASSWORD;
});

afterEach(() => {
	process.env = { ...originalEnv };
});

describe("SeedAdmin", () => {
	it("does nothing when env vars are unset", async () => {
		const { prisma, updates } = fakePrisma();
		await new SeedAdmin(prisma, signUp).execute();

		expect(updates).toHaveLength(0);
	});

	it("creates a superAdmin when the email doesn't exist yet", async () => {
		process.env.ADMIN_EMAIL = "admin@example.com";
		process.env.ADMIN_PASSWORD = "secret1";

		const { prisma, updates } = fakePrisma();
		await new SeedAdmin(prisma, signUp).execute();

		expect(updates).toEqual([{ data: { companyId: null, role: "superAdmin" }, id: "u_new" }]);
	});

	it("promotes an already-existing user instead of signing up again", async () => {
		process.env.ADMIN_EMAIL = "admin@example.com";
		process.env.ADMIN_PASSWORD = "secret1";

		const { prisma, updates } = fakePrisma([{ email: "admin@example.com", id: "u_existing" }]);
		await new SeedAdmin(prisma, signUp).execute();

		expect(updates).toEqual([{ data: { companyId: null, role: "superAdmin" }, id: "u_existing" }]);
	});
});
