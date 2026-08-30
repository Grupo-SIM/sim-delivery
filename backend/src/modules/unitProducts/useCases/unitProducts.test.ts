import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { AssociateProduct } from "./AssociateProduct";
import { ListUnitProducts } from "./ListUnitProducts";
import { RemoveUnitProduct } from "./RemoveUnitProduct";
import { UpdateUnitProduct } from "./UpdateUnitProduct";
import { UpdateUnitProductsAvailability } from "./UpdateUnitProductsAvailability";

interface Scoped {
	id: string;
	companyId: string;
}
interface Assoc {
	id: string;
	unitId: string;
	productId: string;
}

function prismaWith(opts: {
	units?: Scoped[];
	products?: Scoped[];
	categories?: Scoped[];
	associations?: Assoc[];
}) {
	const units = opts.units ?? [];
	const products = opts.products ?? [];
	const categories = opts.categories ?? [];
	const associations = opts.associations ?? [];
	const created: unknown[] = [];
	const deleted: string[] = [];
	const updatedMany: unknown[] = [];
	const scoped = (rows: Scoped[]) => ({
		count: async ({ where }: { where: { companyId: string; id: { in: string[] } } }) =>
			rows.filter(row => row.companyId === where.companyId && where.id.in.includes(row.id)).length,
		findFirst: async ({ where }: { where: { companyId: string | null; id: string } }) =>
			rows.find(row => row.companyId === where.companyId && row.id === where.id) ?? null,
	});

	return {
		created,
		deleted,
		updatedMany,
		prisma: {
			category: scoped(categories),
			product: scoped(products),
			unit: scoped(units),
			unitProduct: {
				create: async ({ data }: { data: unknown }) => {
					created.push(data);
					return { id: "new", ...(data as object), categories: [], tags: [] };
				},
				delete: async ({ where }: { where: { id: string } }) => {
					deleted.push(where.id);
					return {};
				},
				findFirst: async ({ where }: { where: { id: string; unitId: string } }) =>
					associations.find(a => a.id === where.id && a.unitId === where.unitId) ?? null,
				findMany: async ({ where }: { where: { unitId: string } }) =>
					associations.filter(a => a.unitId === where.unitId).map(a => ({ ...a, categories: [], tags: [] })),
				findUnique: async ({
					where,
				}: {
					where: { unitId_productId: { productId: string; unitId: string } };
				}) =>
					associations.find(
						a =>
							a.unitId === where.unitId_productId.unitId && a.productId === where.unitId_productId.productId,
					) ?? null,
				update: async ({ data, where }: { data: object; where: { id: string } }) => ({
					id: where.id,
					...data,
				}),
				updateMany: async (args: unknown) => {
					updatedMany.push(args);
					return { count: 2 };
				},
			},
		} as unknown as PrismaInstance,
	};
}

describe("unit-products use-cases", () => {
	it("AssociateProduct rejects a unit outside the company", async () => {
		const { prisma } = prismaWith({ units: [{ companyId: "cmp_1", id: "unit1" }] });
		await expect(
			new AssociateProduct(prisma).execute("cmp_2", "unit1", { productId: "prod1" }),
		).rejects.toThrow("UNIT_NOT_FOUND");
	});

	it("AssociateProduct rejects a product from another company", async () => {
		const { prisma } = prismaWith({ units: [{ companyId: "cmp_1", id: "unit1" }] });
		await expect(
			new AssociateProduct(prisma).execute("cmp_1", "unit1", { productId: "prod1" }),
		).rejects.toThrow("PRODUCT_NOT_FOUND");
	});

	it("AssociateProduct rejects an unknown category", async () => {
		const { prisma } = prismaWith({
			products: [{ companyId: "cmp_1", id: "prod1" }],
			units: [{ companyId: "cmp_1", id: "unit1" }],
		});
		await expect(
			new AssociateProduct(prisma).execute("cmp_1", "unit1", { categoryIds: ["cat_x"], productId: "prod1" }),
		).rejects.toThrow("CATEGORY_NOT_FOUND");
	});

	it("AssociateProduct rejects a duplicate association", async () => {
		const { prisma } = prismaWith({
			associations: [{ id: "up1", productId: "prod1", unitId: "unit1" }],
			products: [{ companyId: "cmp_1", id: "prod1" }],
			units: [{ companyId: "cmp_1", id: "unit1" }],
		});
		await expect(
			new AssociateProduct(prisma).execute("cmp_1", "unit1", { productId: "prod1" }),
		).rejects.toThrow("UNIT_PRODUCT_EXISTS");
	});

	it("AssociateProduct persists the unit, product and overrides", async () => {
		const { created, prisma } = prismaWith({
			categories: [{ companyId: "cmp_1", id: "cat1" }],
			products: [{ companyId: "cmp_1", id: "prod1" }],
			units: [{ companyId: "cmp_1", id: "unit1" }],
		});
		await new AssociateProduct(prisma).execute("cmp_1", "unit1", {
			available: false,
			categoryIds: ["cat1"],
			priceCentsOverride: 990,
			productId: "prod1",
		});
		expect(created[0]).toMatchObject({
			available: false,
			categories: { create: [{ categoryId: "cat1" }] },
			categoriesOverridden: true,
			priceCentsOverride: 990,
			productId: "prod1",
			unitId: "unit1",
		});
	});

	it("ListUnitProducts scopes to the unit and guards ownership", async () => {
		const { prisma } = prismaWith({
			associations: [{ id: "up1", productId: "prod1", unitId: "unit1" }],
			units: [{ companyId: "cmp_1", id: "unit1" }],
		});
		expect(await new ListUnitProducts(prisma).execute("cmp_1", "unit1")).toHaveLength(1);
		await expect(new ListUnitProducts(prisma).execute("cmp_2", "unit1")).rejects.toThrow("UNIT_NOT_FOUND");
	});

	it("UpdateUnitProduct rejects an association of another unit", async () => {
		const { prisma } = prismaWith({ units: [{ companyId: "cmp_1", id: "unit1" }] });
		await expect(
			new UpdateUnitProduct(prisma).execute("cmp_1", "unit1", "up_x", { available: false }),
		).rejects.toThrow("UNIT_PRODUCT_NOT_FOUND");
	});

	it("UpdateUnitProductsAvailability updates every product in an owned unit", async () => {
		const { prisma, updatedMany } = prismaWith({
			units: [{ companyId: "cmp_1", id: "unit1" }],
		});

		const result = await new UpdateUnitProductsAvailability(prisma).execute("cmp_1", "unit1", {
			available: false,
		});

		expect(result).toEqual({ updatedCount: 2 });
		expect(updatedMany[0]).toEqual({
			data: { available: false },
			where: { unitId: "unit1" },
		});
	});

	it("UpdateUnitProductsAvailability respects effective category overrides", async () => {
		const { prisma, updatedMany } = prismaWith({
			categories: [{ companyId: "cmp_1", id: "cat1" }],
			units: [{ companyId: "cmp_1", id: "unit1" }],
		});

		await new UpdateUnitProductsAvailability(prisma).execute("cmp_1", "unit1", {
			available: true,
			categoryId: "cat1",
		});

		expect(updatedMany[0]).toMatchObject({
			data: { available: true },
			where: {
				OR: [
					{ categories: { some: { categoryId: "cat1" } }, categoriesOverridden: true },
					{
						categoriesOverridden: false,
						product: { categories: { some: { categoryId: "cat1" } } },
					},
				],
				unitId: "unit1",
			},
		});
	});

	it("UpdateUnitProductsAvailability rejects a category from another company", async () => {
		const { prisma } = prismaWith({
			categories: [{ companyId: "cmp_2", id: "cat1" }],
			units: [{ companyId: "cmp_1", id: "unit1" }],
		});

		await expect(
			new UpdateUnitProductsAvailability(prisma).execute("cmp_1", "unit1", {
				available: true,
				categoryId: "cat1",
			}),
		).rejects.toThrow("CATEGORY_NOT_FOUND");
	});

	it("RemoveUnitProduct deletes an owned association", async () => {
		const { deleted, prisma } = prismaWith({
			associations: [{ id: "up1", productId: "prod1", unitId: "unit1" }],
			units: [{ companyId: "cmp_1", id: "unit1" }],
		});
		await new RemoveUnitProduct(prisma).execute("cmp_1", "unit1", "up1");
		expect(deleted).toEqual(["up1"]);
	});
});
