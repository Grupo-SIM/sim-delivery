import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { GetCashbackBalance } from "./GetCashbackBalance";

const baseCompany = { id: "cmp_1", slug: "demo" };
const baseCustomer = { companyId: "cmp_1", id: "cust_1", userId: "user_1" };

function makePrisma(
	opts: {
		company?: typeof baseCompany | null;
		customer?: typeof baseCustomer | null;
		ledgerEntries?: { amount: number }[];
	} = {},
) {
	const { company = baseCompany, customer = baseCustomer, ledgerEntries = [] } = opts;

	return {
		prisma: {
			cashbackLedger: {
				findMany: async () => ledgerEntries,
			},
			company: {
				findUnique: async ({ where }: { where: { slug?: string } }) =>
					company?.slug === where.slug ? company : null,
			},
			customer: {
				findFirst: async ({ where }: { where: { companyId: string; userId: string } }) =>
					customer?.companyId === where.companyId && customer?.userId === where.userId ? customer : null,
			},
		} as unknown as PrismaInstance,
	};
}

describe("GetCashbackBalance", () => {
	it("throws COMPANY_NOT_FOUND for unknown slug", async () => {
		const { prisma } = makePrisma({ company: null });
		await expect(new GetCashbackBalance(prisma).execute("user_1", "unknown")).rejects.toThrow(
			"COMPANY_NOT_FOUND",
		);
	});

	it("throws CUSTOMER_NOT_FOUND when no customer record", async () => {
		const { prisma } = makePrisma({ customer: null });
		await expect(new GetCashbackBalance(prisma).execute("user_1", "demo")).rejects.toThrow(
			"CUSTOMER_NOT_FOUND",
		);
	});

	it("returns 0 when ledger is empty", async () => {
		const { prisma } = makePrisma();
		const result = await new GetCashbackBalance(prisma).execute("user_1", "demo");
		expect(result).toEqual({ balanceCents: 0 });
	});

	it("sums accruals correctly", async () => {
		const { prisma } = makePrisma({ ledgerEntries: [{ amount: 300 }, { amount: 200 }] });
		const result = await new GetCashbackBalance(prisma).execute("user_1", "demo");
		expect(result).toEqual({ balanceCents: 500 });
	});

	it("subtracts redemptions from accruals", async () => {
		const { prisma } = makePrisma({ ledgerEntries: [{ amount: 500 }, { amount: -200 }] });
		const result = await new GetCashbackBalance(prisma).execute("user_1", "demo");
		expect(result).toEqual({ balanceCents: 300 });
	});

	it("floors balance at 0 (no negative balance)", async () => {
		const { prisma } = makePrisma({ ledgerEntries: [{ amount: 100 }, { amount: -500 }] });
		const result = await new GetCashbackBalance(prisma).execute("user_1", "demo");
		expect(result).toEqual({ balanceCents: 0 });
	});
});
