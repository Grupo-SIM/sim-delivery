import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { GetCustomer } from "./GetCustomer";
import { GetMyCustomer } from "./GetMyCustomer";
import { ListCustomers } from "./ListCustomers";
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

function makePrisma(
	opts: {
		company?: { id: string; slug: string } | null;
		customer?: {
			id: string;
			companyId: string;
			userId: string;
			cpf: string | null;
			phone: string | null;
		} | null;
	} = {},
) {
	const { company = { id: "cmp_1", slug: "demo" }, customer = null } = opts;
	const users: Record<string, object> = {};
	const customers: object[] = customer ? [customer] : [];
	const addresses: object[] = [];

	return {
		addresses,
		customers,
		prisma: {
			address: {
				create: async ({ data }: { data: object }) => {
					const a = { createdAt: new Date(), id: "addr_1", isDefault: false, updatedAt: new Date(), ...data };
					addresses.push(a);
					return a;
				},
				updateMany: async ({ data, where }: { data: { isDefault: boolean }; where: { customerId: string } }) => {
					for (const address of addresses as Array<{ customerId?: string; isDefault?: boolean }>) {
						if (address.customerId === where.customerId) address.isDefault = data.isDefault;
					}
					return { count: addresses.length };
				},
			},
			company: {
				findUnique: async ({ where }: { where: { slug?: string } }) =>
					company?.slug === where.slug ? company : null,
			},
			customer: {
				findFirst: async ({ where }: { where: { companyId: string; userId: string } }) =>
					(customers.find((c: any) => c.companyId === where.companyId && c.userId === where.userId) ??
						null) as any,
				findUniqueOrThrow: async () => ({ ...customer, addresses }),
				upsert: async ({ create, update, where }: { create: object; update: object; where: object }) => {
					const existing = customers.find((c: any) => (c as any).userId === (where as any).userId);
					if (existing) {
						Object.assign(existing as object, update);
						return existing;
					}
					const c = { createdAt: new Date(), id: "cust_1", updatedAt: new Date(), ...create };
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
				customer: { companyId: "cmp_1", cpf: null, id: "cust_1", phone: null, userId: "user_1" },
			});
			const result = await new GetMyCustomer(prisma).execute("user_1", "demo");
			expect(result).toMatchObject({ id: "cust_1", userId: "user_1" });
		});
	});

	describe("UpsertCustomer", () => {
		it("throws COMPANY_NOT_FOUND when slug is unknown", async () => {
			const { prisma } = makePrisma({ company: null });
			await expect(
				new UpsertCustomer(prisma).execute("user_1", {
					address: baseAddress,
					name: "Maria",
					slug: "unknown",
				}),
			).rejects.toThrow("COMPANY_NOT_FOUND");
		});

		it("creates a customer and address on first call", async () => {
			const { addresses, customers, prisma, users } = makePrisma();
			await new UpsertCustomer(prisma).execute("user_1", {
				address: baseAddress,
				cpf: "12345678901",
				name: "Maria Silva",
				slug: "demo",
			});
			expect(customers).toHaveLength(1);
			expect(customers[0]).toMatchObject({ companyId: "cmp_1", userId: "user_1" });
			expect(addresses).toHaveLength(1);
			expect(addresses[0]).toMatchObject({ addressLine: "Av. Paulista", number: "1000" });
			expect(users.user_1).toMatchObject({ name: "Maria Silva" });
		});

		it("keeps prior addresses and makes newest address default", async () => {
			const { addresses, prisma } = makePrisma({
				customer: { companyId: "cmp_1", cpf: null, id: "cust_1", phone: null, userId: "user_1" },
			});
			addresses.push({ ...baseAddress, customerId: "cust_1", id: "addr_1", isDefault: true });
			await new UpsertCustomer(prisma).execute("user_1", {
				address: { ...baseAddress, number: "2000" },
				name: "Maria Silva",
				slug: "demo",
			});
			expect(addresses).toHaveLength(2);
			expect(addresses[0]).toMatchObject({ isDefault: false, number: "1000" });
			expect(addresses[1]).toMatchObject({ isDefault: true, number: "2000" });
		});
	});

	describe("customer administration", () => {
		it("scopes customer list by company and search", async () => {
			let where: unknown;
			const prisma = {
				customer: {
					count: async ({ where: nextWhere }: { where: unknown }) => {
						where = nextWhere;
						return 0;
					},
					findMany: async ({ where: nextWhere }: { where: unknown }) => {
						where = nextWhere;
						return [];
					},
				},
			} as unknown as PrismaInstance;

			const result = await new ListCustomers(prisma).execute("cmp_1", { search: "maria" });
			expect(result).toMatchObject({ items: [], page: 1, pageSize: 20, total: 0 });
			expect(where).toMatchObject({ companyId: "cmp_1" });
		});

		it("does not return a customer outside current company", async () => {
			const prisma = {
				customer: { findFirst: async () => null },
			} as unknown as PrismaInstance;

			await expect(new GetCustomer(prisma).execute("cmp_1", "cust_other")).rejects.toThrow("CUSTOMER_NOT_FOUND");
		});
	});
});
