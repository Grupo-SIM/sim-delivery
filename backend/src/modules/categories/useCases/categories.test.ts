import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CreateCategory } from "./CreateCategory";
import { DeleteCategory } from "./DeleteCategory";
import { ListCategories } from "./ListCategories";
import { UpdateCategory } from "./UpdateCategory";

function prismaWith(categories: Array<{ id: string; companyId: string }>) {
	const created: unknown[] = [];
	const deleted: string[] = [];
	return {
		created,
		deleted,
		prisma: {
			category: {
				create: async ({ data }: { data: unknown }) => {
					created.push(data);
					return { id: "new", ...(data as object) };
				},
				delete: async ({ where }: { where: { id: string } }) => {
					deleted.push(where.id);
					return {};
				},
				findFirst: async ({ where }: { where: { companyId: string | null; id: string } }) =>
					categories.find(c => c.companyId === where.companyId && c.id === where.id) ?? null,
				findMany: async ({ where }: { where: { companyId?: string } }) =>
					where.companyId ? categories.filter(c => c.companyId === where.companyId) : categories,
				update: async ({ data, where }: { data: object; where: { id: string } }) => ({ id: where.id, ...data }),
			},
		} as unknown as PrismaInstance,
	};
}

describe("categories use-cases", () => {
	it("CreateCategory requires a company", async () => {
		const { prisma } = prismaWith([]);
		await expect(new CreateCategory(prisma).execute(null, { name: "Drinks" })).rejects.toThrow("NO_COMPANY");
	});

	it("CreateCategory attaches the companyId", async () => {
		const { created, prisma } = prismaWith([]);
		await new CreateCategory(prisma).execute("cmp_1", { name: "Drinks" });
		expect(created[0]).toMatchObject({ companyId: "cmp_1", name: "Drinks" });
	});

	it("ListCategories lists across companies without a company and scopes otherwise", async () => {
		const { prisma } = prismaWith([{ companyId: "cmp_1", id: "cat1" }]);
		expect(await new ListCategories(prisma).execute(null)).toHaveLength(1);
		expect(await new ListCategories(prisma).execute("cmp_1")).toHaveLength(1);
	});

	it("UpdateCategory rejects a category from another company", async () => {
		const { prisma } = prismaWith([{ companyId: "cmp_1", id: "cat1" }]);
		await expect(new UpdateCategory(prisma).execute("cmp_2", "cat1", { name: "X" })).rejects.toThrow(
			"CATEGORY_NOT_FOUND",
		);
	});

	it("DeleteCategory removes a category of the same company", async () => {
		const { deleted, prisma } = prismaWith([{ companyId: "cmp_1", id: "cat1" }]);
		await new DeleteCategory(prisma).execute("cmp_1", "cat1");
		expect(deleted).toEqual(["cat1"]);
	});
});
