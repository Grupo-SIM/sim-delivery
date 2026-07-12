import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CreateTag } from "./CreateTag";
import { DeleteTag } from "./DeleteTag";
import { ListTags } from "./ListTags";
import { UpdateTag } from "./UpdateTag";

function prismaWith(tags: Array<{ id: string; companyId: string }>) {
	const created: unknown[] = [];
	const deleted: string[] = [];
	return {
		created,
		deleted,
		prisma: {
			tag: {
				create: async ({ data }: { data: unknown }) => {
					created.push(data);
					return { id: "new", ...(data as object) };
				},
				delete: async ({ where }: { where: { id: string } }) => {
					deleted.push(where.id);
					return {};
				},
				findFirst: async ({ where }: { where: { companyId: string | null; id: string } }) =>
					tags.find(tag => tag.companyId === where.companyId && tag.id === where.id) ?? null,
				findMany: async ({ where }: { where: { companyId?: string } }) =>
					where.companyId ? tags.filter(tag => tag.companyId === where.companyId) : tags,
				update: async ({ data, where }: { data: object; where: { id: string } }) => ({ id: where.id, ...data }),
			},
		} as unknown as PrismaInstance,
	};
}

describe("tags use-cases", () => {
	it("CreateTag requires a company", async () => {
		const { prisma } = prismaWith([]);
		await expect(new CreateTag(prisma).execute(null, { name: "Vegan" })).rejects.toThrow("NO_COMPANY");
	});

	it("CreateTag attaches the companyId", async () => {
		const { created, prisma } = prismaWith([]);
		await new CreateTag(prisma).execute("cmp_1", { color: "#22c55e", name: "Vegan" });
		expect(created[0]).toMatchObject({ color: "#22c55e", companyId: "cmp_1", name: "Vegan" });
	});

	it("ListTags lists across companies without a company and scopes otherwise", async () => {
		const { prisma } = prismaWith([{ companyId: "cmp_1", id: "tag1" }]);
		expect(await new ListTags(prisma).execute(null)).toHaveLength(1);
		expect(await new ListTags(prisma).execute("cmp_1")).toHaveLength(1);
	});

	it("UpdateTag rejects a tag from another company", async () => {
		const { prisma } = prismaWith([{ companyId: "cmp_1", id: "tag1" }]);
		await expect(new UpdateTag(prisma).execute("cmp_2", "tag1", { name: "X" })).rejects.toThrow("TAG_NOT_FOUND");
	});

	it("DeleteTag removes a tag of the same company", async () => {
		const { deleted, prisma } = prismaWith([{ companyId: "cmp_1", id: "tag1" }]);
		await new DeleteTag(prisma).execute("cmp_1", "tag1");
		expect(deleted).toEqual(["tag1"]);
	});
});
