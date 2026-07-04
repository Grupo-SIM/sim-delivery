import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { GetMyCustomer } from "./GetMyCustomer";
import { UpsertCustomer } from "./UpsertCustomer";

const baseAddress = {
	addressLine: "Av. Paulista",
	city: "São Paulo",
	complement: undefined,
	neighborhood: "Bela Vista",
	number: "1000",
	reference: undefined,
	state: "SP",
	zipCode: "01310100",
};

function makePrisma(opts: {
	company?: { id: string; variantKey: string } | null;
	customer?: { id: string; companyId: string; userId: string; cpf: string | null; phone: string | null } | null;
} = {}) {
	const { company = { id: "cmp_1", variantKey: "demo" }, customer = null } = opts;
	const users: Record<string, object> = {};
	const customers: Array<object> = customer ? [customer] : [];
	const addresses: Array<object> = [];

	return {
		addresses,
		customers,
		prisma: {
			address: {
				create: async ({ data }: { data: object }) => {
					const a = { id: "addr_1", isDefault: false, createdAt: new Date(), updatedAt: new Date(), ...data };
					addresses.push(a);
					return a;
				},
			},
			company: {
				findUnique: async ({ where }: { where: { variantKey?: string } }) =>
					company?.variantKey === where.variantKey ? company : null,
			},
			customer: {
				findFirst: async ({ where }: { where: { companyId: string; userId: string } }) =>
					(customers.find((c: any) => c.companyId === where.companyId && c.userId === where.userId) ?? null) as any,
				findUniqueOrThrow: async () => ({ ...customer, addresses }),
				upsert: async ({ create, update, where }: { create: object; update: object; where: object }) => {
					const existing = customers.find((c: any) => (c as any).userId === (where as any).userId);
					if (existing) {
						Object.assign(existing as object, update);
						return existing;
					}
					const c = { id: "cust_1", createdAt: new Date(), updatedAt: new Date(), ...create };
					customers.push(c);
					return c;
				},
			},
			user: {
				update: async ({ data, where }: { data: { name: string }; where: { id: string } }) => {
					users[where.id] = data;
					return { id: where.id, ...data };
				},
			},
		} as unknown as PrismaInstance,
		users,
	};
}

describe("customers use-cases", () => {
	describe("GetMyCustomer", () => {
		it("returns null when company not found", async () => {
			const { prisma } = makePrisma({ company: null });
			const result = await new GetMyCustomer(prisma).execute("user_1", "unknown");
			expect(result).toBeNull();
		});

		it("returns null when customer has no record yet", async () => {
			const { prisma } = makePrisma({ customer: null });
			const result = await new GetMyCustomer(prisma).execute("user_1", "demo");
			expect(result).toBeNull();
		});

		it("returns the customer when found", async () => {
			const { prisma } = makePrisma({
				customer: { id: "cust_1", companyId: "cmp_1", userId: "user_1", cpf: null, phone: null },
			});
			const result = await new GetMyCustomer(prisma).execute("user_1", "demo");
			expect(result).toMatchObject({ id: "cust_1", userId: "user_1" });
		});
	});

	describe("UpsertCustomer", () => {
		it("throws COMPANY_NOT_FOUND when variantKey is unknown", async () => {
			const { prisma } = makePrisma({ company: null });
			await expect(
				new UpsertCustomer(prisma).execute("user_1", {
					address: baseAddress,
					name: "Maria",
					variantKey: "unknown",
				}),
			).rejects.toThrow("COMPANY_NOT_FOUND");
		});

		it("creates a customer and address on first call", async () => {
			const { addresses, customers, prisma, users } = makePrisma();
			await new UpsertCustomer(prisma).execute("user_1", {
				address: baseAddress,
				cpf: "12345678901",
				name: "Maria Silva",
				variantKey: "demo",
			});
			expect(customers).toHaveLength(1);
			expect(customers[0]).toMatchObject({ companyId: "cmp_1", userId: "user_1" });
			expect(addresses).toHaveLength(1);
			expect(addresses[0]).toMatchObject({ addressLine: "Av. Paulista", number: "1000" });
			expect(users["user_1"]).toMatchObject({ name: "Maria Silva" });
		});

		it("adds a new address on repeat call", async () => {
			const { addresses, prisma } = makePrisma({
				customer: { id: "cust_1", companyId: "cmp_1", userId: "user_1", cpf: null, phone: null },
			});
			await new UpsertCustomer(prisma).execute("user_1", {
				address: { ...baseAddress, number: "2000" },
				name: "Maria Silva",
				variantKey: "demo",
			});
			expect(addresses).toHaveLength(1);
			expect(addresses[0]).toMatchObject({ number: "2000" });
		});
	});
});
