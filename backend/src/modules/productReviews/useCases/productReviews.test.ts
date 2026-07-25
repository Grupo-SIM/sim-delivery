import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CreateProductReview } from "./CreateProductReview";
import { ListProductReviews } from "./ListProductReviews";

interface OrderRow {
	companyId: string;
	customerId: string;
	id: string;
	items: { productId: string }[];
	status: string;
}

const baseOrder: OrderRow = {
	companyId: "cmp_1",
	customerId: "cust_1",
	id: "order_1",
	items: [{ productId: "prod_1" }],
	status: "entregue",
};

const baseBody = {
	comment: "Muito saboroso",
	companyId: "cmp_1",
	customerId: "cust_1",
	orderId: "order_1",
	productId: "prod_1",
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
		productReview: {
			create: async ({ data }: { data: Record<string, unknown> }) => {
				created.push(data);

				return {
					...data,
					createdAt: new Date("2026-01-01T12:00:00Z"),
					customer: { user: { name: "Maria" } },
					id: "product_review_1",
					product: { title: "Pizza Calabresa" },
					updatedAt: new Date("2026-01-01T12:00:00Z"),
				};
			},
			findUnique: async () => (existingReview ? { id: "product_review_0" } : null),
		},
	} as unknown as PrismaInstance;

	return { created, prisma };
}

describe("CreateProductReview", () => {
	it("creates a review for a delivered order containing the product", async () => {
		const { created, prisma } = makeCreatePrisma();

		const result = await new CreateProductReview(prisma).execute(baseBody);

		expect(result).toMatchObject({
			comment: "Muito saboroso",
			companyId: "cmp_1",
			customerId: "cust_1",
			customerName: "Maria",
			id: "product_review_1",
			orderId: "order_1",
			productId: "prod_1",
			productTitle: "Pizza Calabresa",
			rating: 5,
		});
		expect(created).toHaveLength(1);
	});

	it("accepts a picked-up order too", async () => {
		const { prisma } = makeCreatePrisma({ orders: [{ ...baseOrder, status: "retirado" }] });

		expect((await new CreateProductReview(prisma).execute(baseBody)).rating).toBe(5);
	});

	it("stores a missing comment as null", async () => {
		const { created, prisma } = makeCreatePrisma();

		await new CreateProductReview(prisma).execute({ ...baseBody, comment: undefined });

		expect(created[0].comment).toBeNull();
	});

	it("requires a company scope", async () => {
		const { prisma } = makeCreatePrisma();

		await expect(new CreateProductReview(prisma).execute({ ...baseBody, companyId: null })).rejects.toThrow(
			"ORDER_NOT_FOUND",
		);
	});

	it("rejects ratings outside 1..5", async () => {
		const { prisma } = makeCreatePrisma();

		await expect(new CreateProductReview(prisma).execute({ ...baseBody, rating: 0 })).rejects.toThrow(
			"INVALID_RATING",
		);
		await expect(new CreateProductReview(prisma).execute({ ...baseBody, rating: 6 })).rejects.toThrow(
			"INVALID_RATING",
		);
	});

	it("does not let a customer review someone else's order", async () => {
		const { prisma } = makeCreatePrisma();

		await expect(
			new CreateProductReview(prisma).execute({ ...baseBody, customerId: "cust_2" }),
		).rejects.toThrow("ORDER_NOT_FOUND");
	});

	it("rejects orders that have not been completed", async () => {
		const { prisma } = makeCreatePrisma({ orders: [{ ...baseOrder, status: "preparando" }] });

		await expect(new CreateProductReview(prisma).execute(baseBody)).rejects.toThrow("ORDER_NOT_ELIGIBLE");
	});

	it("rejects a product that was not part of the order", async () => {
		const { prisma } = makeCreatePrisma({ orders: [{ ...baseOrder, items: [{ productId: "prod_2" }] }] });

		await expect(new CreateProductReview(prisma).execute(baseBody)).rejects.toThrow("PRODUCT_NOT_IN_ORDER");
	});

	it("allows only one review per product per order", async () => {
		const { prisma } = makeCreatePrisma({ existingReview: true });

		await expect(new CreateProductReview(prisma).execute(baseBody)).rejects.toThrow("ALREADY_REVIEWED");
	});
});

interface ProductReviewRow {
	comment: string | null;
	companyId: string;
	createdAt: Date;
	customer: { user: { name: string | null } };
	customerId: string;
	id: string;
	orderId: string;
	product: { title: string };
	productId: string;
	rating: number;
	updatedAt: Date;
}

function makeProductReviewRow(overrides: Partial<ProductReviewRow> = {}): ProductReviewRow {
	return {
		comment: "Muito bom",
		companyId: "cmp_1",
		createdAt: new Date("2026-01-01T12:00:00Z"),
		customer: { user: { name: "Maria" } },
		customerId: "cust_1",
		id: "product_review_1",
		orderId: "order_1",
		product: { title: "Pizza Calabresa" },
		productId: "prod_1",
		rating: 5,
		updatedAt: new Date("2026-01-01T12:00:00Z"),
		...overrides,
	};
}

function makeListPrisma(rows: ProductReviewRow[]) {
	const prisma = {
		productReview: {
			findMany: async ({ where }: { where: { companyId?: string; productId?: string } }) =>
				rows.filter(
					row =>
						(where.companyId === undefined || row.companyId === where.companyId) &&
						(where.productId === undefined || row.productId === where.productId),
				),
		},
	} as unknown as PrismaInstance;

	return { prisma };
}

describe("ListProductReviews", () => {
	it("maps reviews with the customer name and product title", async () => {
		const { prisma } = makeListPrisma([makeProductReviewRow()]);

		const result = await new ListProductReviews(prisma).execute("cmp_1", {});

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			customerName: "Maria",
			id: "product_review_1",
			productTitle: "Pizza Calabresa",
			rating: 5,
		});
	});

	it("does not leak another company's reviews", async () => {
		const { prisma } = makeListPrisma([
			makeProductReviewRow(),
			makeProductReviewRow({ companyId: "cmp_2", id: "product_review_2" }),
		]);

		const result = await new ListProductReviews(prisma).execute("cmp_1", {});

		expect(result.map(review => review.id)).toEqual(["product_review_1"]);
	});

	it("filters by product when requested", async () => {
		const { prisma } = makeListPrisma([
			makeProductReviewRow(),
			makeProductReviewRow({ id: "product_review_2", productId: "prod_2" }),
		]);

		const result = await new ListProductReviews(prisma).execute("cmp_1", { productId: "prod_2" });

		expect(result.map(review => review.id)).toEqual(["product_review_2"]);
	});
});
