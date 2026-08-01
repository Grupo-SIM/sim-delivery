import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CreateCustomerAddress } from "./CreateCustomerAddress";
import { GetCustomer } from "./GetCustomer";
import { GetMyCustomer } from "./GetMyCustomer";
import { ListCustomers } from "./ListCustomers";
import { UpdateCustomerAddress } from "./UpdateCustomerAddress";
import { UpdateMyCustomer } from "./UpdateMyCustomer";
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
	interface AddressRecord {
		createdAt?: Date;
		customerId: string;
		deletedAt?: Date | null;
		id: string;
		isDefault: boolean;
		[key: string]: unknown;
	}
	interface CustomerRecord {
		companyId: string;
		cpf: string | null;
		id: string;
		phone: string | null;
		userId: string;
	}

	const { company = { id: "cmp_1", slug: "demo" }, customer = null } = opts;
	const users: Record<string, object> = {};
	const customers: CustomerRecord[] = customer ? [customer] : [];
	const addresses: AddressRecord[] = [];

	return {
		addresses,
		customers,
		prisma: {
			address: {
				count: async ({ where }: { where: { customerId: string; deletedAt: null } }) =>
					addresses.filter(address => address.customerId === where.customerId && !address.deletedAt).length,
				create: async ({ data }: { data: object }) => {
					const address = {
						createdAt: new Date(),
						id: `addr_${addresses.length + 1}`,
						isDefault: false,
						updatedAt: new Date(),
						...data,
					} as unknown as AddressRecord;
					addresses.push(address);
					return address;
				},
				findFirst: async ({ where }: { where: any }) =>
					addresses.find(
						address =>
							(!where.customerId || address.customerId === where.customerId) &&
							(!where.id || address.id === where.id) &&
							(!where.deletedAt || !address.deletedAt) &&
							(!where.customer ||
								customers.some(
									customer => customer.id === address.customerId && customer.userId === where.customer.userId,
								)),
					) ?? null,
				update: async ({ data, where }: { data: object; where: { id: string } }) => {
					const address = addresses.find(address => address.id === where.id);
					if (!address) throw new Error("ADDRESS_NOT_FOUND");
					Object.assign(address, data);
					return address;
				},
				updateMany: async ({
					data,
					where,
				}: {
					data: { isDefault: boolean };
					where: { customerId: string };
				}) => {
					let count = 0;
					for (const address of addresses) {
						if (
							address.customerId === where.customerId &&
							((where as any).isDefault === undefined || address.isDefault === (where as any).isDefault)
						) {
							address.isDefault = data.isDefault;
							count++;
						}
					}
					return { count };
				},
			},
			company: {
				findUnique: async ({ where }: { where: { slug?: string } }) =>
					company?.slug === where.slug ? company : null,
			},
			customer: {
				findFirst: async ({ where }: { where: any }) =>
					customers.find(
						customer =>
							(!where.companyId || customer.companyId === where.companyId) &&
							(!where.userId || customer.userId === where.userId),
					) ?? null,
				findUnique: async ({ where }: { where: { userId: string } }) =>
					customers.find(customer => customer.userId === where.userId) ?? null,
				findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
					const found = customers.find(customer => customer.id === where.id);
					if (!found) throw new Error("CUSTOMER_NOT_FOUND");
					return {
						...found,
						addresses: addresses.filter(address => address.customerId === found.id && !address.deletedAt),
					};
				},
				upsert: async ({
					create,
					update,
					where,
				}: {
					create: object;
					update: object;
					where: { userId: string };
				}) => {
					const existing = customers.find(customer => customer.userId === where.userId);
					if (existing) {
						Object.assign(existing, update);
						return existing;
					}
					const created = {
						cpf: null,
						id: "cust_1",
						phone: null,
						...create,
					} as CustomerRecord;
					customers.push(created);
					return created;
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

			await expect(new GetCustomer(prisma).execute("cmp_1", "cust_other")).rejects.toThrow(
				"CUSTOMER_NOT_FOUND",
			);
		});
	});
});

describe("customer profile mutations", () => {
	it("upserts CPF and phone without creating an address", async () => {
		const { addresses, customers, prisma } = makePrisma();
		await new UpdateMyCustomer(prisma).execute("user_1", {
			cpf: "12345678901",
			phone: "11999999999",
			slug: "demo",
		});

		expect(addresses).toHaveLength(0);
		expect(customers).toEqual([
			expect.objectContaining({ cpf: "12345678901", phone: "11999999999", userId: "user_1" }),
		]);
	});

	it("creates a default address and clears the prior default", async () => {
		const { addresses, prisma } = makePrisma({
			customer: { companyId: "cmp_1", cpf: null, id: "cust_1", phone: null, userId: "user_1" },
		});
		addresses.push({ ...baseAddress, customerId: "cust_1", id: "addr_1", isDefault: true });

		await new CreateCustomerAddress(prisma).execute("user_1", {
			...baseAddress,
			label: "Casa",
			slug: "demo",
		});

		expect(addresses).toHaveLength(2);
		expect(addresses[0]).toMatchObject({ isDefault: false });
		expect(addresses[1]).toMatchObject({ isDefault: true, label: "Casa" });
	});

	it("rejects editing an address owned by another user", async () => {
		const { addresses, prisma } = makePrisma({
			customer: { companyId: "cmp_1", cpf: null, id: "cust_1", phone: null, userId: "user_1" },
		});
		addresses.push({ ...baseAddress, customerId: "cust_1", id: "addr_1", isDefault: true });

		await expect(
			new UpdateCustomerAddress(prisma).execute("user_2", "addr_1", { label: "Trabalho" }),
		).rejects.toThrow("CUSTOMER_NOT_FOUND");
	});

	it("sets an existing address as the default", async () => {
		const { addresses, prisma } = makePrisma({
			customer: { companyId: "cmp_1", cpf: null, id: "cust_1", phone: null, userId: "user_1" },
		});
		addresses.push(
			{ ...baseAddress, customerId: "cust_1", id: "addr_1", isDefault: true },
			{ ...baseAddress, customerId: "cust_1", id: "addr_2", isDefault: false, number: "2000" },
		);

		await new UpdateCustomerAddress(prisma).execute("user_1", "addr_2", { isDefault: true });

		expect(addresses[0]).toMatchObject({ isDefault: false });
		expect(addresses[1]).toMatchObject({ isDefault: true });
	});
});
