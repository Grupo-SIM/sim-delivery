import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ProductOptions } from "./ProductOptions";

function prismaWith(companyId = "cmp_1") {
	const groups = [{ id: "group_1", maxSelect: 1, productId: "product_1", selectionType: "single" }];
	const deleted: string[] = [];
	return {
		deleted,
		prisma: {
			option: {
				create: async ({ data }: { data: object }) => ({ id: "option_1", ...data }),
				delete: async ({ where }: { where: { id: string } }) => {
					deleted.push(where.id);
				},
				findFirst: async ({ where }: { where: { groupId: string; id: string } }) =>
					where.groupId === "group_1" && where.id === "option_1" ? { id: "option_1" } : null,
				update: async ({ data, where }: { data: object; where: { id: string } }) => ({
					id: where.id,
					...data,
				}),
			},
			optionGroup: {
				create: async ({ data }: { data: object }) => ({ id: "group_2", ...data }),
				delete: async ({ where }: { where: { id: string } }) => {
					deleted.push(where.id);
				},
				findFirst: async ({ where }: { where: { id: string; productId: string } }) =>
					groups.find(group => group.id === where.id && group.productId === where.productId) ?? null,
				findMany: async () => [],
				update: async ({ data, where }: { data: object; where: { id: string } }) => ({
					id: where.id,
					...data,
				}),
			},
			product: {
				findFirst: async ({ where }: { where: { companyId?: string; id: string } }) =>
					where.id === "product_1" && (!where.companyId || where.companyId === companyId)
						? { companyId, id: "product_1" }
						: null,
			},
		} as unknown as PrismaInstance,
	};
}

describe("ProductOptions", () => {
	it("scopes group writes to the product tenant", async () => {
		const { prisma } = prismaWith();
		await expect(
			new ProductOptions(prisma).createGroup("cmp_2", "product_1", {
				maxSelect: 1,
				name: "Sabor",
				priceRule: "sum",
				selectionType: "single",
			}),
		).rejects.toThrow("PRODUCT_NOT_FOUND");
	});

	it("rejects multi-value max on single selection groups at creation", async () => {
		const { prisma } = prismaWith();
		await expect(
			new ProductOptions(prisma).createGroup("cmp_1", "product_1", {
				maxSelect: 2,
				name: "Sabor",
				priceRule: "sum",
				selectionType: "single",
			}),
		).rejects.toThrow("INVALID_OPTION_RULES");
	});

	it("rejects multi-value limits on single selection groups", async () => {
		const { prisma } = prismaWith();
		await expect(
			new ProductOptions(prisma).updateGroup("cmp_1", "product_1", "group_1", { maxSelect: 2 }),
		).rejects.toThrow("INVALID_OPTION_RULES");
	});

	it("cascades option deletion through its owned group", async () => {
		const { deleted, prisma } = prismaWith();
		await new ProductOptions(prisma).deleteOption("cmp_1", "product_1", "group_1", "option_1");
		expect(deleted).toEqual(["option_1"]);
	});

	it("saves groups without an interactive transaction", async () => {
		const calls: Array<{ action: string; data?: unknown }> = [];
		const prisma = {
			optionGroup: {
				create: async ({ data }: { data: object }) => {
					calls.push({ action: "create", data });
					return { id: "created_group" };
				},
				deleteMany: async ({ where }: { where: object }) => {
					calls.push({ action: "deleteMany", data: where });
					return { count: 0 };
				},
				findMany: async ({ include }: { include?: object }) => {
					if (include) return [];
					return [];
				},
				update: async ({ data }: { data: object }) => {
					calls.push({ action: "update", data });
					return { id: "group_1" };
				},
			},
			product: {
				findFirst: async () => ({ id: "product_1" }),
			},
		} as unknown as PrismaInstance;

		await new ProductOptions(prisma).save("cmp_1", "product_1", {
			groups: [
				{
					maxSelect: 1,
					name: "Adicionais",
					options: [{ name: "Queijo", priceDeltaCents: 200 }],
					priceRule: "sum",
					selectionType: "single",
				},
			],
		});

		expect(calls).toEqual([
			{
				action: "create",
				data: {
					maxSelect: 1,
					name: "Adicionais",
					options: {
						createMany: {
							data: [
								{
									available: undefined,
									description: undefined,
									imageUrl: undefined,
									maxPerItem: undefined,
									name: "Queijo",
									priceDeltaCents: 200,
									sortOrder: undefined,
								},
							],
						},
					},
					priceRule: "sum",
					productId: "product_1",
					selectionType: "single",
				},
			},
		]);
	});
});
