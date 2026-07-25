import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CreateReview } from "./CreateReview";
import { ListReviews } from "./ListReviews";

interface OrderRow {
	companyId: string;
	customerId: string;
	id: string;
	status: string;
}

const baseOrder: OrderRow = {
	companyId: "cmp_1",
	customerId: "cust_1",
	id: "order_1",
	status: "entregue",
};

const baseBody = {
	comment: "Chegou quentinha",
	companyId: "cmp_1",
	customerId: "cust_1",
	orderId: "order_1",
	rating: 5,
	slug: "demo",
};

function makeCreatePrisma(opts: { existingReview?: boolean; orders?: OrderRow[] } = {}) {
	const { existingReview = false, orders = [baseOrder] } = opts;
	const created: Record<string, unknown>[] = [];

	const prisma = {
		order: {
			findFirst: async ({ where }: { where: { companyId: string; customerId: string; id: string } }) =>
				orders.find(
					order =>
						order.companyId === where.companyId &&
						order.customerId === where.customerId &&
						order.id === where.id,
				) ?? null,
		},
		review: {
			create: async ({ data }: { data: Record<string, unknown> }) => {
				created.push(data);

				return {
					...data,
					createdAt: new Date("2026-01-01T12:00:00Z"),
					customer: { user: { name: "Maria" } },
					id: "review_1",
					updatedAt: new Date("2026-01-01T12:00:00Z"),
				};
			},
			findUnique: async () => (existingReview ? { id: "review_0" } : null),
		},
	} as unknown as PrismaInstance;

	return { created, prisma };
}

describe("CreateReview", () => {
	it("creates a review for a delivered order", async () => {
		const { created, prisma } = makeCreatePrisma();

		const result = await new CreateReview(prisma).execute(baseBody);

		expect(result).toMatchObject({
			comment: "Chegou quentinha",
			companyId: "cmp_1",
			customerId: "cust_1",
			customerName: "Maria",
			id: "review_1",
			orderId: "order_1",
			rating: 5,
		});
		expect(created).toHaveLength(1);
	});

	it("accepts a picked-up order too", async () => {
		const { prisma } = makeCreatePrisma({ orders: [{ ...baseOrder, status: "retirado" }] });

		expect((await new CreateReview(prisma).execute(baseBody)).rating).toBe(5);
	});

	it("stores a missing comment as null", async () => {
		const { created, prisma } = makeCreatePrisma();

		await new CreateReview(prisma).execute({ ...baseBody, comment: undefined });

		expect(created[0].comment).toBeNull();
	});

	it("requires a company scope", async () => {
		const { prisma } = makeCreatePrisma();

		await expect(new CreateReview(prisma).execute({ ...baseBody, companyId: null })).rejects.toThrow(
			"ORDER_NOT_FOUND",
		);
	});

	it("rejects ratings outside 1..5", async () => {
		const { prisma } = makeCreatePrisma();

		await expect(new CreateReview(prisma).execute({ ...baseBody, rating: 0 })).rejects.toThrow(
			"INVALID_RATING",
		);
		await expect(new CreateReview(prisma).execute({ ...baseBody, rating: 6 })).rejects.toThrow(
			"INVALID_RATING",
		);
	});

	it("accepts the boundary ratings", async () => {
		const { prisma } = makeCreatePrisma();

		expect((await new CreateReview(prisma).execute({ ...baseBody, rating: 1 })).rating).toBe(1);
		expect((await new CreateReview(prisma).execute({ ...baseBody, rating: 5 })).rating).toBe(5);
	});

	it("does not let a customer review someone else's order", async () => {
		const { prisma } = makeCreatePrisma();

		await expect(new CreateReview(prisma).execute({ ...baseBody, customerId: "cust_2" })).rejects.toThrow(
			"ORDER_NOT_FOUND",
		);
	});

	it("does not let another company's order be reviewed", async () => {
		const { prisma } = makeCreatePrisma();

		await expect(new CreateReview(prisma).execute({ ...baseBody, companyId: "cmp_2" })).rejects.toThrow(
			"ORDER_NOT_FOUND",
		);
	});

	it("rejects orders that have not been completed", async () => {
		const { prisma } = makeCreatePrisma({ orders: [{ ...baseOrder, status: "preparando" }] });

		await expect(new CreateReview(prisma).execute(baseBody)).rejects.toThrow("ORDER_NOT_ELIGIBLE");
	});

	it("rejects a cancelled order", async () => {
		const { prisma } = makeCreatePrisma({ orders: [{ ...baseOrder, status: "cancelado" }] });

		await expect(new CreateReview(prisma).execute(baseBody)).rejects.toThrow("ORDER_NOT_ELIGIBLE");
	});

	it("allows only one review per order", async () => {
		const { prisma } = makeCreatePrisma({ existingReview: true });

		await expect(new CreateReview(prisma).execute(baseBody)).rejects.toThrow("ALREADY_REVIEWED");
	});
});

interface ReviewRow {
	comment: string | null;
	companyId: string;
	createdAt: Date;
	customer: { user: { name: string | null } };
	customerId: string;
	id: string;
	orderId: string;
	order: { unitId: string };
	rating: number;
	updatedAt: Date;
}

function makeReviewRow(overrides: Partial<ReviewRow> = {}): ReviewRow {
	return {
		comment: "Muito bom",
		companyId: "cmp_1",
		createdAt: new Date("2026-01-01T12:00:00Z"),
		customer: { user: { name: "Maria" } },
		customerId: "cust_1",
		id: "review_1",
		order: { unitId: "unit_1" },
		orderId: "order_1",
		rating: 5,
		updatedAt: new Date("2026-01-01T12:00:00Z"),
		...overrides,
	};
}

function makeListPrisma(rows: ReviewRow[]) {
	const prisma = {
		review: {
			findMany: async ({ where }: { where: { companyId?: string; order?: { unitId: string } } }) =>
				rows.filter(
					row =>
						(where.companyId === undefined || row.companyId === where.companyId) &&
						(where.order === undefined || row.order.unitId === where.order.unitId),
				),
		},
	} as unknown as PrismaInstance;

	return { prisma };
}

describe("ListReviews", () => {
	it("maps reviews with the customer name", async () => {
		const { prisma } = makeListPrisma([makeReviewRow()]);

		const result = await new ListReviews(prisma).execute("cmp_1", {});

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ customerName: "Maria", id: "review_1", rating: 5 });
	});

	it("falls back to an empty name when the user has none", async () => {
		const { prisma } = makeListPrisma([makeReviewRow({ customer: { user: { name: null } } })]);

		expect((await new ListReviews(prisma).execute("cmp_1", {}))[0].customerName).toBe("");
	});

	it("returns an empty list when there are no reviews", async () => {
		const { prisma } = makeListPrisma([]);

		expect(await new ListReviews(prisma).execute("cmp_1", {})).toEqual([]);
	});

	it("does not leak another company's reviews", async () => {
		const { prisma } = makeListPrisma([
			makeReviewRow(),
			makeReviewRow({ companyId: "cmp_2", id: "review_2" }),
		]);

		const result = await new ListReviews(prisma).execute("cmp_1", {});

		expect(result.map(review => review.id)).toEqual(["review_1"]);
	});

	it("lists every company's reviews for super admins", async () => {
		const { prisma } = makeListPrisma([
			makeReviewRow(),
			makeReviewRow({ companyId: "cmp_2", id: "review_2" }),
		]);

		expect(await new ListReviews(prisma).execute(null, {})).toHaveLength(2);
	});

	it("filters by unit when requested", async () => {
		const { prisma } = makeListPrisma([
			makeReviewRow(),
			makeReviewRow({ id: "review_2", order: { unitId: "unit_2" } }),
		]);

		const result = await new ListReviews(prisma).execute("cmp_1", { unitId: "unit_2" });

		expect(result.map(review => review.id)).toEqual(["review_2"]);
	});
});
