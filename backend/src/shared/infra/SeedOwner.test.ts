import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { SignUpFn } from "@/modules/staff/useCases/InviteStaff";
import type { PrismaInstance } from "@/shared/infra/sql";
import { SeedOwner } from "./SeedOwner";

interface UserRow {
	id: string;
	email: string;
}

function fakePrisma(existing: UserRow[] = [], hasOwner = false) {
	const updates: Array<{ id: string; data: unknown }> = [];
	return {
		prisma: {
			company: {
				findUnique: async ({ where }: { where: { slug: string | undefined } }) =>
					where.slug === "zero-grau" ? { id: "cmp_1" } : null,
			},
			user: {
				findFirst: async () => (hasOwner ? { id: "company-owner" } : null),
				findUnique: async ({ where }: { where: { email: string } }) =>
					existing.find(user => user.email === where.email) ?? null,
				update: async ({ data, where }: { data: unknown; where: { id: string } }) => {
					updates.push({ data, id: where.id });
					return { id: where.id, ...(data as object) };
				},
			},
		} as unknown as PrismaInstance,
		updates,
	};
}

const signUp: SignUpFn = async () => ({ user: { id: "u_new" } });

const originalEnv = { ...process.env };

beforeEach(() => {
	delete process.env.COMPANY_SLUG;
	delete process.env.OWNER_EMAIL;
	delete process.env.OWNER_NAME;
	delete process.env.OWNER_PASSWORD;
});

afterEach(() => {
	process.env = { ...originalEnv };
});

describe("SeedOwner", () => {
	it("does nothing when env vars are unset", async () => {
		const { prisma, updates } = fakePrisma();
		await new SeedOwner(prisma, signUp).execute();

		expect(updates).toHaveLength(0);
	});

	it("creates an owner for the deployment company when the email doesn't exist yet", async () => {
		process.env.COMPANY_SLUG = "zero-grau";
		process.env.OWNER_EMAIL = "owner@example.com";
		process.env.OWNER_PASSWORD = "secret1";

		const { prisma, updates } = fakePrisma();
		await new SeedOwner(prisma, signUp).execute();

		expect(updates).toEqual([{ data: { companyId: "cmp_1", role: "owner" }, id: "u_new" }]);
	});

	it("does not promote or move an existing user", async () => {
		process.env.COMPANY_SLUG = "zero-grau";
		process.env.OWNER_EMAIL = "owner@example.com";
		process.env.OWNER_PASSWORD = "secret1";

		const { prisma, updates } = fakePrisma([{ email: "owner@example.com", id: "u_existing" }]);
		await new SeedOwner(prisma, signUp).execute();

		expect(updates).toHaveLength(0);
	});

	it("does nothing when the deployment company is unknown", async () => {
		process.env.COMPANY_SLUG = "missing";
		process.env.OWNER_EMAIL = "owner@example.com";
		process.env.OWNER_PASSWORD = "secret1";

		const { prisma, updates } = fakePrisma();
		await new SeedOwner(prisma, signUp).execute();

		expect(updates).toHaveLength(0);
	});
});

it("does not create a replacement owner when the provisioning email changes", async () => {
	process.env.COMPANY_SLUG = "zero-grau";
	process.env.OWNER_EMAIL = "new-owner@example.com";
	process.env.OWNER_PASSWORD = "secret1";
	const { prisma, updates } = fakePrisma([], true);
	let signUps = 0;
	await new SeedOwner(prisma, async () => {
		signUps++;
		return { user: { id: "new" } };
	}).execute();
	expect(signUps).toBe(0);
	expect(updates).toHaveLength(0);
});
