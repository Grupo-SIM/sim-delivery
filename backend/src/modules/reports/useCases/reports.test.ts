import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { GetBestSellers } from "./GetBestSellers";
import { GetRevenueSummary } from "./GetRevenueSummary";

type Where = Record<string, unknown>;

function makeRevenuePrisma(rows: { companyId: string; createdAt: Date; status: string; total: number; unitId: string }[]) {
	const calls: Where[] = [];

	const prisma = {
		order: {
			aggregate: async ({ where }: { where: Where }) => {
				calls.push(where);

				const status = where.status as { in: string[] };
				const createdAt = where.createdAt as { gte: Date } | undefined;

				const matched = rows.filter(
					row =>
						(where.companyId === undefined || row.companyId === where.companyId) &&
						status.in.includes(row.status) &&
						(where.unitId === undefined || row.unitId === where.unitId) &&
						(createdAt === undefined || row.createdAt >= createdAt.gte),
				);

				return {
					_count: { id: matched.length },
					_sum: { total: matched.length > 0 ? matched.reduce((sum, row) => sum + row.total, 0) : null },
				};
			},
		},
	} as unknown as PrismaInstance;

	return { calls, prisma };
}

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

describe("GetRevenueSummary", () => {
	it("sums completed orders and averages the ticket", async () => {
		const { prisma } = makeRevenuePrisma([
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 3000 },
			{ companyId: "cmp_1", createdAt: now, status: "retirado", total: 2000 },
		].map(row => ({ ...row, unitId: "unit_1" })));

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", {});

		expect(result).toEqual({ averageOrderValue: 2500, orderCount: 2, totalRevenue: 5000 });
	});

	it("ignores orders that are not completed", async () => {
		const { prisma } = makeRevenuePrisma([
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 1000, unitId: "unit_1" },
			{ companyId: "cmp_1", createdAt: now, status: "cancelado", total: 9000, unitId: "unit_1" },
			{ companyId: "cmp_1", createdAt: now, status: "preparando", total: 9000, unitId: "unit_1" },
		]);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", {});

		expect(result).toEqual({ averageOrderValue: 1000, orderCount: 1, totalRevenue: 1000 });
	});

	it("returns zeroes when nothing matches", async () => {
		const { prisma } = makeRevenuePrisma([]);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", {});

		expect(result).toEqual({ averageOrderValue: 0, orderCount: 0, totalRevenue: 0 });
	});

	it("rounds the average order value", async () => {
		const { prisma } = makeRevenuePrisma([
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 1000, unitId: "unit_1" },
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 1001, unitId: "unit_1" },
		]);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", {});

		expect(result.averageOrderValue).toBe(1001);
	});

	it("does not count another company's orders", async () => {
		const { prisma } = makeRevenuePrisma([
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 1000, unitId: "unit_1" },
			{ companyId: "cmp_2", createdAt: now, status: "entregue", total: 8000, unitId: "unit_9" },
		]);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", {});

		expect(result).toEqual({ averageOrderValue: 1000, orderCount: 1, totalRevenue: 1000 });
	});

	it("aggregates across companies when companyId is null (super admin)", async () => {
		const { calls, prisma } = makeRevenuePrisma([
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 1000, unitId: "unit_1" },
			{ companyId: "cmp_2", createdAt: now, status: "entregue", total: 8000, unitId: "unit_9" },
		]);

		const result = await new GetRevenueSummary(prisma).execute(null, {});

		expect(calls[0]).not.toHaveProperty("companyId");
		expect(result.totalRevenue).toBe(9000);
	});

	it("scopes by unit when unitId is given", async () => {
		const { prisma } = makeRevenuePrisma([
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 1000, unitId: "unit_1" },
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 4000, unitId: "unit_2" },
		]);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", { unitId: "unit_2" });

		expect(result).toEqual({ averageOrderValue: 4000, orderCount: 1, totalRevenue: 4000 });
	});

	it("keeps only today's orders for the today period", async () => {
		const { prisma } = makeRevenuePrisma([
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 1000, unitId: "unit_1" },
			{ companyId: "cmp_1", createdAt: daysAgo(2), status: "entregue", total: 4000, unitId: "unit_1" },
		]);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", { period: "today" });

		expect(result.orderCount).toBe(1);
		expect(result.totalRevenue).toBe(1000);
	});

	it("keeps the last seven days for the week period", async () => {
		const { prisma } = makeRevenuePrisma([
			{ companyId: "cmp_1", createdAt: daysAgo(2), status: "entregue", total: 1000, unitId: "unit_1" },
			{ companyId: "cmp_1", createdAt: daysAgo(30), status: "entregue", total: 4000, unitId: "unit_1" },
		]);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", { period: "week" });

		expect(result.orderCount).toBe(1);
		expect(result.totalRevenue).toBe(1000);
	});

	it("does not filter by date without a period", async () => {
		const { calls, prisma } = makeRevenuePrisma([
			{ companyId: "cmp_1", createdAt: daysAgo(400), status: "entregue", total: 1000, unitId: "unit_1" },
		]);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", {});

		expect(calls[0]).not.toHaveProperty("createdAt");
		expect(result.orderCount).toBe(1);
	});
});

interface BestSellerRow {
	_sum: { quantity: number | null; total: number | null };
	productId: string;
	productName: string;
}

function makeBestSellersPrisma(rows: BestSellerRow[]) {
	const calls: Where[] = [];

	const prisma = {
		orderItem: {
			groupBy: async ({ take, where }: { take: number; where: { order: Where } }) => {
				calls.push(where.order);

				return rows.slice(0, take);
			},
		},
	} as unknown as PrismaInstance;

	return { calls, prisma };
}

describe("GetBestSellers", () => {
	it("maps grouped rows to quantity and revenue totals", async () => {
		const { prisma } = makeBestSellersPrisma([
			{ _sum: { quantity: 12, total: 24000 }, productId: "prod_1", productName: "Pizza" },
			{ _sum: { quantity: 3, total: 1500 }, productId: "prod_2", productName: "Refri" },
		]);

		const result = await new GetBestSellers(prisma).execute("cmp_1", {});

		expect(result).toEqual([
			{ productId: "prod_1", productName: "Pizza", totalQuantity: 12, totalRevenue: 24000 },
			{ productId: "prod_2", productName: "Refri", totalQuantity: 3, totalRevenue: 1500 },
		]);
	});

	it("defaults null sums to zero", async () => {
		const { prisma } = makeBestSellersPrisma([
			{ _sum: { quantity: null, total: null }, productId: "prod_1", productName: "Pizza" },
		]);

		const result = await new GetBestSellers(prisma).execute("cmp_1", {});

		expect(result[0]).toMatchObject({ totalQuantity: 0, totalRevenue: 0 });
	});

	it("returns an empty list when there are no sales", async () => {
		const { prisma } = makeBestSellersPrisma([]);

		expect(await new GetBestSellers(prisma).execute("cmp_1", {})).toEqual([]);
	});

	it("caps the ranking at ten products", async () => {
		const rows = Array.from({ length: 25 }, (_, i) => ({
			_sum: { quantity: 25 - i, total: (25 - i) * 100 },
			productId: `prod_${i}`,
			productName: `Produto ${i}`,
		}));
		const { prisma } = makeBestSellersPrisma(rows);

		expect(await new GetBestSellers(prisma).execute("cmp_1", {})).toHaveLength(10);
	});

	it("scopes the order filter by company, unit and completed statuses", async () => {
		const { calls, prisma } = makeBestSellersPrisma([]);

		await new GetBestSellers(prisma).execute("cmp_1", { unitId: "unit_2" });

		expect(calls[0]).toMatchObject({
			companyId: "cmp_1",
			status: { in: ["entregue", "retirado"] },
			unitId: "unit_2",
		});
	});

	it("omits the company filter for super admins", async () => {
		const { calls, prisma } = makeBestSellersPrisma([]);

		await new GetBestSellers(prisma).execute(null, {});

		expect(calls[0]).not.toHaveProperty("companyId");
	});

	it("applies the period window to the order filter", async () => {
		const { calls, prisma } = makeBestSellersPrisma([]);

		await new GetBestSellers(prisma).execute("cmp_1", { period: "month" });

		const createdAt = calls[0].createdAt as { gte: Date };
		expect(createdAt.gte.getDate()).toBe(1);
		expect(createdAt.gte.getMonth()).toBe(now.getMonth());
	});
});
