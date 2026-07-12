import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { GetLoyaltyBalance } from "./GetLoyaltyBalance";

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
			company: {
				findUnique: async ({ where }: { where: { slug?: string } }) =>
					company?.slug === where.slug ? company : null,
			},
			customer: {
				findFirst: async ({ where }: { where: { companyId: string; userId: string } }) =>
					customer?.companyId === where.companyId && customer?.userId === where.userId ? customer : null,
			},
			loyaltyLedger: {
				findMany: async () => ledgerEntries,
			},
		} as unknown as PrismaInstance,
	};
}

describe("GetLoyaltyBalance", () => {
	it("throws COMPANY_NOT_FOUND for unknown slug", async () => {
		const { prisma } = makePrisma({ company: null });
		await expect(new GetLoyaltyBalance(prisma).execute("user_1", "unknown")).rejects.toThrow(
			"COMPANY_NOT_FOUND",
		);
	});

	it("throws CUSTOMER_NOT_FOUND when no customer record", async () => {
		const { prisma } = makePrisma({ customer: null });
		await expect(new GetLoyaltyBalance(prisma).execute("user_1", "demo")).rejects.toThrow(
			"CUSTOMER_NOT_FOUND",
		);
	});

	it("returns 0 when ledger is empty", async () => {
		const { prisma } = makePrisma();
		const result = await new GetLoyaltyBalance(prisma).execute("user_1", "demo");
		expect(result).toEqual({ balancePoints: 0 });
	});

	it("sums earned points correctly", async () => {
		const { prisma } = makePrisma({ ledgerEntries: [{ amount: 100 }, { amount: 50 }] });
		const result = await new GetLoyaltyBalance(prisma).execute("user_1", "demo");
		expect(result).toEqual({ balancePoints: 150 });
	});

	it("subtracts redemptions from earned points", async () => {
		const { prisma } = makePrisma({ ledgerEntries: [{ amount: 200 }, { amount: -80 }] });
		const result = await new GetLoyaltyBalance(prisma).execute("user_1", "demo");
		expect(result).toEqual({ balancePoints: 120 });
	});

	it("floors balance at 0 (no negative balance)", async () => {
		const { prisma } = makePrisma({ ledgerEntries: [{ amount: 50 }, { amount: -200 }] });
		const result = await new GetLoyaltyBalance(prisma).execute("user_1", "demo");
		expect(result).toEqual({ balancePoints: 0 });
	});
});
