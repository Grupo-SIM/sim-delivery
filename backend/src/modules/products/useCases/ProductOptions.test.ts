import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ProductOptions } from "./ProductOptions";

function prismaWith(companyId = "cmp_1") {
	const groups = [{ id: "group_1", maxSelect: 1, minSelect: 0, productId: "product_1", selectionType: "single" }];
	const deleted: string[] = [];
	return {
		deleted,
		prisma: {
			option: {
				create: async ({ data }: { data: object }) => ({ id: "option_1", ...data }),
				delete: async ({ where }: { where: { id: string } }) => { deleted.push(where.id); },
				findFirst: async ({ where }: { where: { groupId: string; id: string } }) =>
					where.groupId === "group_1" && where.id === "option_1" ? { id: "option_1" } : null,
				update: async ({ data, where }: { data: object; where: { id: string } }) => ({ id: where.id, ...data }),
			},
			optionGroup: {
				create: async ({ data }: { data: object }) => ({ id: "group_2", ...data }),
				delete: async ({ where }: { where: { id: string } }) => { deleted.push(where.id); },
				findFirst: async ({ where }: { where: { id: string; productId: string } }) =>
					groups.find(group => group.id === where.id && group.productId === where.productId) ?? null,
				findMany: async () => [],
				update: async ({ data, where }: { data: object; where: { id: string } }) => ({ id: where.id, ...data }),
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
		await expect(new ProductOptions(prisma).createGroup("cmp_2", "product_1", {
			maxSelect: 1, minSelect: 0, name: "Sabor", priceRule: "sum", selectionType: "single",
		})).rejects.toThrow("PRODUCT_NOT_FOUND");
	});

	it("rejects impossible selection limits", async () => {
		const { prisma } = prismaWith();
		await expect(new ProductOptions(prisma).createGroup("cmp_1", "product_1", {
			maxSelect: 1, minSelect: 2, name: "Sabor", priceRule: "sum", selectionType: "single",
		})).rejects.toThrow("INVALID_OPTION_RULES");
	});

	it("rejects multi-value limits on single selection groups", async () => {
		const { prisma } = prismaWith();
		await expect(new ProductOptions(prisma).updateGroup("cmp_1", "product_1", "group_1", { maxSelect: 2 })).rejects.toThrow("INVALID_OPTION_RULES");
	});

	it("cascades option deletion through its owned group", async () => {
		const { deleted, prisma } = prismaWith();
		await new ProductOptions(prisma).deleteOption("cmp_1", "product_1", "group_1", "option_1");
		expect(deleted).toEqual(["option_1"]);
	});
});
