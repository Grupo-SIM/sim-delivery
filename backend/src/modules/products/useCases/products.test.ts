import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CreateProduct } from "./CreateProduct";
import { DeleteProduct } from "./DeleteProduct";
import { ListProducts } from "./ListProducts";
import { UpdateProduct } from "./UpdateProduct";

function prismaWith(products: Array<{ id: string; companyId: string }>) {
	const created: unknown[] = [];
	const deleted: string[] = [];
	return {
		created,
		deleted,
		prisma: {
			product: {
				create: async ({ data }: { data: unknown }) => {
					created.push(data);
					return { id: "new", ...(data as object) };
				},
				delete: async ({ where }: { where: { id: string } }) => {
					deleted.push(where.id);
					return {};
				},
				findFirst: async ({ where }: { where: { companyId?: string; id: string } }) =>
					products.find(
						product =>
							(where.companyId ? product.companyId === where.companyId : true) && product.id === where.id,
					) ?? null,
				findMany: async ({ where }: { where: { companyId?: string } }) =>
					where.companyId ? products.filter(product => product.companyId === where.companyId) : products,
				update: async ({ data, where }: { data: object; where: { id: string } }) => ({
					id: where.id,
					...data,
				}),
			},
		} as unknown as PrismaInstance,
	};
}

describe("products use-cases", () => {
	it("CreateProduct requires a company", async () => {
		const { prisma } = prismaWith([]);
		await expect(
			new CreateProduct(prisma).execute(null, {
				basePriceCents: 1200,
				imageUrl: "https://x.test/a.png",
				title: "A",
			}),
		).rejects.toThrow("NO_COMPANY");
	});

	it("CreateProduct attaches the companyId", async () => {
		const { created, prisma } = prismaWith([]);
		await new CreateProduct(prisma).execute("cmp_1", {
			basePriceCents: 1200,
			cashbackPercentOverride: 5,
			description: "Warm",
			imageUrl: "https://x.test/a.png",
			title: "Cheese bread",
		});
		expect(created[0]).toMatchObject({
			basePriceCents: 1200,
			companyId: "cmp_1",
			slug: "cheese-bread",
			title: "Cheese bread",
		});
	});

	it("CreateProduct allows a product without an image", async () => {
		const { created, prisma } = prismaWith([]);
		await new CreateProduct(prisma).execute("cmp_1", {
			basePriceCents: 1200,
			title: "Cheese bread",
		});
		expect(created[0]).toMatchObject({ companyId: "cmp_1", title: "Cheese bread" });
		expect(created[0]).not.toHaveProperty("imageUrl");
	});

	it("ListProducts lists across companies without a company and scopes otherwise", async () => {
		const { prisma } = prismaWith([{ companyId: "cmp_1", id: "prod1" }]);
		expect(await new ListProducts(prisma).execute(null)).toHaveLength(1);
		expect(await new ListProducts(prisma).execute("cmp_1")).toHaveLength(1);
	});

	it("UpdateProduct rejects a product from another company", async () => {
		const { prisma } = prismaWith([{ companyId: "cmp_1", id: "prod1" }]);
		await expect(new UpdateProduct(prisma).execute("cmp_2", "prod1", { title: "X" })).rejects.toThrow(
			"PRODUCT_NOT_FOUND",
		);
	});

	it("UpdateProduct allows superAdmin (null company) to update a product from any company", async () => {
		const { prisma } = prismaWith([{ companyId: "cmp_1", id: "prod1" }]);
		const product = await new UpdateProduct(prisma).execute(null, "prod1", { title: "X" });
		expect(product).toMatchObject({ id: "prod1", title: "X" });
	});

	it("DeleteProduct removes a product of the same company", async () => {
		const { deleted, prisma } = prismaWith([{ companyId: "cmp_1", id: "prod1" }]);
		await new DeleteProduct(prisma).execute("cmp_1", "prod1");
		expect(deleted).toEqual(["prod1"]);
	});

	it("DeleteProduct allows superAdmin (null company) to delete a product from any company", async () => {
		const { deleted, prisma } = prismaWith([{ companyId: "cmp_1", id: "prod1" }]);
		await new DeleteProduct(prisma).execute(null, "prod1");
		expect(deleted).toEqual(["prod1"]);
	});
});
