import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { GetBestSellers } from "./GetBestSellers";
import { GetDashboardAnalytics } from "./GetDashboardAnalytics";
import { GetBusinessMetrics } from "./GetBusinessMetrics";
import { GetFinancialAnalytics } from "./GetFinancialAnalytics";
import { GetProductProfitability } from "./GetProductProfitability";
import { GetRevenueSummary } from "./GetRevenueSummary";

type Where = Record<string, unknown>;

function makeRevenuePrisma(
	rows: { companyId: string; createdAt: Date; status: string; total: number; unitId: string }[],
	items: { costCents: number | null; netRevenueCents: number | null; total: number }[] = [],
) {
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
						(where.unitId === undefined ||
							(where.unitId instanceof Object && "in" in where.unitId
								? (where.unitId.in as string[]).includes(row.unitId)
								: row.unitId === where.unitId)) &&
						(createdAt === undefined || row.createdAt >= createdAt.gte),
				);

				return {
					_count: { id: matched.length },
					_sum: { total: matched.length > 0 ? matched.reduce((sum, row) => sum + row.total, 0) : null },
				};
			},
		},
		orderItem: { findMany: async () => items },
	} as unknown as PrismaInstance;

	return { calls, prisma };
}

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

describe("GetRevenueSummary", () => {
	it("sums completed orders and averages the ticket", async () => {
		const { prisma } = makeRevenuePrisma(
			[
				{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 3000 },
				{ companyId: "cmp_1", createdAt: now, status: "retirado", total: 2000 },
			].map(row => ({ ...row, unitId: "unit_1" })),
		);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", {});

		expect(result).toMatchObject({ averageOrderValue: 2500, orderCount: 2, totalRevenue: 5000 });
	});

	it("ignores orders that are not completed", async () => {
		const { prisma } = makeRevenuePrisma([
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 1000, unitId: "unit_1" },
			{ companyId: "cmp_1", createdAt: now, status: "cancelado", total: 9000, unitId: "unit_1" },
			{ companyId: "cmp_1", createdAt: now, status: "preparando", total: 9000, unitId: "unit_1" },
		]);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", {});

		expect(result).toMatchObject({ averageOrderValue: 1000, orderCount: 1, totalRevenue: 1000 });
	});

	it("returns zeroes when nothing matches", async () => {
		const { prisma } = makeRevenuePrisma([]);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", {});

		expect(result).toMatchObject({ averageOrderValue: 0, orderCount: 0, totalRevenue: 0 });
	});

	it("rounds the average order value", async () => {
		const { prisma } = makeRevenuePrisma([
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 1000, unitId: "unit_1" },
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 1001, unitId: "unit_1" },
		]);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", {});

		expect(result.averageOrderValue).toBe(1001);
	});

	it("calculates gross margin only from items with known cost", async () => {
		const { prisma } = makeRevenuePrisma(
			[{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 3500, unitId: "unit_1" }],
			[
				{ costCents: 400, netRevenueCents: 1000, total: 1200 },
				{ costCents: null, netRevenueCents: 2000, total: 2300 },
			],
		);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", {});

		expect(result).toMatchObject({
			grossMarginPercent: 60,
			grossProfitCents: 600,
			knownCostCents: 400,
			knownNetRevenueCents: 1000,
			unknownCostRevenueCents: 2000,
		});
	});

	it("does not count another company's orders", async () => {
		const { prisma } = makeRevenuePrisma([
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 1000, unitId: "unit_1" },
			{ companyId: "cmp_2", createdAt: now, status: "entregue", total: 8000, unitId: "unit_9" },
		]);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", {});

		expect(result).toMatchObject({ averageOrderValue: 1000, orderCount: 1, totalRevenue: 1000 });
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

		expect(result).toMatchObject({ averageOrderValue: 4000, orderCount: 1, totalRevenue: 4000 });
	});

	it("scopes a unit-assigned employee to every permitted unit", async () => {
		const { prisma } = makeRevenuePrisma([
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 1000, unitId: "unit_1" },
			{ companyId: "cmp_1", createdAt: now, status: "entregue", total: 4000, unitId: "unit_2" },
		]);

		const result = await new GetRevenueSummary(prisma).execute("cmp_1", {}, ["unit_1"]);

		expect(result).toMatchObject({ averageOrderValue: 1000, orderCount: 1, totalRevenue: 1000 });
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
	_sum: {
		costCents?: number | null;
		netRevenueCents?: number | null;
		quantity: number | null;
		total: number | null;
	};
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

		expect(result).toMatchObject([
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

describe("GetDashboardAnalytics", () => {
	it("groups completed orders by hour and delivery fee radius", async () => {
		const prisma = {
			order: {
				findMany: async () => [
					{
						createdAt: new Date(2026, 6, 23, 12),
						deliveryFee: 500,
						deliveryMethod: "delivery",
						total: 3500,
						unitId: "unit_1",
					},
					{
						createdAt: new Date(2026, 6, 23, 12),
						deliveryFee: 500,
						deliveryMethod: "delivery",
						total: 2500,
						unitId: "unit_1",
					},
					{
						createdAt: new Date(2026, 6, 23, 18),
						deliveryFee: 0,
						deliveryMethod: "pickup",
						total: 4000,
						unitId: "unit_1",
					},
				],
			},
			unit: {
				findMany: async () => [{ deliveryZones: [{ fee: 500, radiusKm: 5 }], id: "unit_1", name: "Centro" }],
			},
		} as unknown as PrismaInstance;

		const result = await new GetDashboardAnalytics(prisma).execute("cmp_1", { groupBy: "hourOfDay" });

		expect(result.groupBy).toBe("hourOfDay");
		expect(result.ordersByPeriod[12]).toEqual({ key: "12", label: "12", orderCount: 2 });
		expect(result.ordersByPeriod[18]).toEqual({ key: "18", label: "18", orderCount: 1 });
		expect(result.deliveryRadiusPerformance).toEqual([
			{
				deliveryFee: 500,
				orderCount: 2,
				radiusKm: 5,
				totalRevenue: 6000,
				unitId: "unit_1",
				unitName: "Centro",
			},
		]);
	});
});

interface FinancialOrderRow {
	cashbackCentsRedeemed?: number;
	deliveryFee?: number;
	discountCents?: number;
	deliveryMethod?: string;
	items: { costCents: number | null; netRevenueCents?: number | null; total: number }[];
	payment: { confirmedAt?: Date | null; method?: string; status: string } | null;
	refundedCents?: number;
	statusEvents?: { createdAt: Date; status: string }[];
	total: number;
	updatedAt?: Date;
}

function makeFinancialPrisma(completed: FinancialOrderRow[], cancelled: FinancialOrderRow[]) {
	const fill = (row: FinancialOrderRow) => ({
		cashbackCentsRedeemed: 0,
		createdAt: now,
		deliveryFee: 0,
		deliveryMethod: "delivery",
		discountCents: 0,
		refundedCents: 0,
		statusEvents: [],
		updatedAt: now,
		...row,
	});

	const prisma = {
		order: {
			findMany: async ({ where }: { where: Where }) => {
				const isCancelled = typeof where.status === "string";
				return (isCancelled ? cancelled : completed).map(fill);
			},
		},
	} as unknown as PrismaInstance;

	return prisma;
}

describe("GetFinancialAnalytics", () => {
	it("computes cancellation metrics only from orders with confirmed payments", async () => {
		const prisma = makeFinancialPrisma(
			[{ items: [{ costCents: 1000, netRevenueCents: 4000, total: 5000 }], payment: null, total: 5000 }],
			[
				{
					// Expired before a payment existed: not an operational cancellation.
					items: [{ costCents: 0, total: 2000 }],
					payment: null,
					statusEvents: [
						{ createdAt: daysAgo(1), status: "awaiting_payment" },
						{ createdAt: now, status: "cancelado" },
					],
					total: 2000,
				},
				{
					// Failed payment: also excluded from cancellation metrics.
					items: [{ costCents: 0, total: 7000 }],
					payment: { status: "failed" },
					statusEvents: [
						{ createdAt: daysAgo(1), status: "awaiting_payment" },
						{ createdAt: now, status: "cancelado" },
					],
					total: 7000,
				},
				{
					// Cancelled after preparation: the consumed reservation's cost stays as waste.
					items: [{ costCents: 300, total: 3000 }],
					payment: { status: "confirmed" },
					statusEvents: [
						{ createdAt: daysAgo(1), status: "awaiting_payment" },
						{ createdAt: daysAgo(1), status: "recebido" },
						{ createdAt: daysAgo(1), status: "em_preparo" },
						{ createdAt: now, status: "cancelado" },
					],
					total: 3000,
				},
			],
		);

		const result = await new GetFinancialAnalytics(prisma).execute("cmp_1", {});

		expect(result.cancellation).toMatchObject({
			averageCanceledTicket: 3000,
			cancelRatePercent: 50,
			canceledOrderCount: 1,
			lostRevenueCents: 3000,
			pendingRefundCents: 3000,
			refundedCents: 0,
			wastedCostCents: 300,
		});
		expect(result.cancellation.byStage).toEqual([
			{ lostRevenueCents: 3000, orderCount: 1, stage: "em_preparo" },
		]);
		expect(result.paymentAbandonment).toEqual({
			abandonedOrderCount: 2,
			abandonedValueCents: 9000,
			averageAbandonedTicket: 4500,
		});
	});

	it("subtracts refunds from net revenue and gross profit", async () => {
		const prisma = makeFinancialPrisma(
			[
				{
					items: [{ costCents: 1000, netRevenueCents: 4000, total: 5000 }],
					payment: { status: "confirmed" },
					refundedCents: 1500,
					total: 5000,
				},
			],
			[],
		);

		const result = await new GetFinancialAnalytics(prisma).execute("cmp_1", {});

		expect(result.summary.refundedCents).toBe(1500);
		expect(result.summary.netRevenueCents).toBe(3500);
		expect(result.summary.grossProfitCents).toBe(4000 - 1000 - 1500);
	});

	it("does not count a refunded cancelled order as pending", async () => {
		const prisma = makeFinancialPrisma(
			[],
			[
				{
					items: [{ costCents: 300, total: 3000 }],
					payment: { status: "confirmed" },
					refundedCents: 3000,
					statusEvents: [{ createdAt: now, status: "cancelado" }],
					total: 3000,
				},
			],
		);

		const result = await new GetFinancialAnalytics(prisma).execute("cmp_1", {});

		expect(result.cancellation.pendingRefundCents).toBe(0);
		expect(result.cancellation.refundedCents).toBe(3000);
		expect(result.cancellation.refundedOrderCount).toBe(1);
	});
});

describe("GetBusinessMetrics", () => {
	it("splits new vs returning customers and computes the repeat rate", async () => {
		const orderA = {
			cashbackCentsRedeemed: 0,
			companyId: "cmp_1",
			coupon: null,
			couponId: null,
			createdAt: daysAgo(2),
			customerId: "cust_1",
			deliveryMethod: "delivery",
			discountCents: 0,
			items: [],
			loyaltyPointsRedeemed: 0,
			status: "entregue",
			statusEvents: [],
			total: 1000,
			unit: { name: "Centro" },
			unitId: "unit_1",
		};
		const orderB = { ...orderA, createdAt: daysAgo(1), customerId: "cust_2", total: 2000 };

		const prisma = {
			order: {
				findMany: async () => [orderA, orderB],
				groupBy: async () => [
					{ _min: { createdAt: daysAgo(2) }, customerId: "cust_1" },
					{ _min: { createdAt: daysAgo(30) }, customerId: "cust_2" },
				],
			},
		} as unknown as PrismaInstance;

		const result = await new GetBusinessMetrics(prisma).execute("cmp_1", {});

		expect(result.customers).toMatchObject({
			newCustomers: 1,
			ordersPerCustomer: 1,
			repeatRatePercent: 50,
			returningCustomers: 1,
			revenuePerCustomer: 1500,
		});
	});
});

describe("GetProductProfitability", () => {
	it("flags products with no recipe instead of a misleading zero cost", async () => {
		const prisma = {
			order: {},
			orderItem: {
				groupBy: async ({ where }: { where: { order: Where } }) =>
					typeof where.order.status === "string"
						? []
						: [
								{
									_sum: { costCents: 400, netRevenueCents: 1000, quantity: 2, total: 1200 },
									productId: "prod_1",
									productName: "Pizza",
								},
							],
			},
			product: {
				findMany: async () => [
					{ basePriceCents: 1500, id: "prod_1", recipeIngredients: [], title: "Pizza" },
				],
			},
			unitInventoryBalance: { groupBy: async () => [] },
		} as unknown as PrismaInstance;

		const result = await new GetProductProfitability(prisma).execute("cmp_1", {});

		expect(result).toEqual([
			expect.objectContaining({
				hasRecipe: false,
				priceCents: 1500,
				productId: "prod_1",
				theoreticalCostCents: null,
				theoreticalMarginPercent: null,
				theoreticalProfitCents: null,
				totalQuantity: 2,
				wastedCostCents: 0,
			}),
		]);
	});

	it("computes theoretical margin from the recipe and average inventory cost", async () => {
		const prisma = {
			order: {},
			orderItem: { groupBy: async () => [] },
			product: {
				findMany: async () => [
					{
						basePriceCents: 2000,
						id: "prod_1",
						recipeIngredients: [
							{
								inventoryItem: { id: "item_1", name: "Queijo", unit: "gram" },
								quantity: 2,
							},
						],
						title: "Pizza",
					},
				],
			},
			unitInventoryBalance: {
				groupBy: async () => [{ _avg: { averageCostCents: 300 }, inventoryItemId: "item_1" }],
			},
		} as unknown as PrismaInstance;

		const result = await new GetProductProfitability(prisma).execute("cmp_1", {});

		expect(result[0]).toMatchObject({
			hasRecipe: true,
			theoreticalCostCents: 600,
			theoreticalMarginPercent: 70,
			theoreticalProfitCents: 1400,
		});
		expect(result[0]?.ingredients).toEqual([
			{
				costCents: 600,
				costSharePercent: 100,
				inventoryItemId: "item_1",
				name: "Queijo",
				quantity: 2,
				unit: "gram",
				unitCostCents: 300,
			},
		]);
	});
});
