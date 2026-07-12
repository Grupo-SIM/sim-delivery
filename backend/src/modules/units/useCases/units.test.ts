import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CreateUnit } from "./CreateUnit";
import { DeleteUnit } from "./DeleteUnit";
import { ListUnits } from "./ListUnits";
import { UpdateUnit } from "./UpdateUnit";

function prismaWith(units: Array<{ id: string; companyId: string }>) {
	const deleted: string[] = [];
	const created: unknown[] = [];
	return {
		created,
		deleted,
		prisma: {
			unit: {
				create: async ({ data }: { data: unknown }) => {
					created.push(data);
					return { id: "new", ...(data as object) };
				},
				delete: async ({ where }: { where: { id: string } }) => {
					deleted.push(where.id);
					return {};
				},
				findFirst: async ({ where }: { where: { companyId?: string; id: string } }) =>
					units.find(u => (where.companyId ? u.companyId === where.companyId : true) && u.id === where.id) ??
					null,
				findMany: async ({ where }: { where: { companyId?: string } }) =>
					where.companyId ? units.filter(u => u.companyId === where.companyId) : units,
				update: async ({ data, where }: { data: object; where: { id: string } }) => ({
					id: where.id,
					...data,
				}),
			},
		} as unknown as PrismaInstance,
	};
}

describe("units use-cases", () => {
	it("CreateUnit requires a company", async () => {
		const { prisma } = prismaWith([]);
		await expect(new CreateUnit(prisma).execute(null, { name: "X" })).rejects.toThrow("NO_COMPANY");
	});

	it("CreateUnit attaches the companyId", async () => {
		const { created, prisma } = prismaWith([]);
		await new CreateUnit(prisma).execute("cmp_1", { name: "Center" });
		expect(created[0]).toMatchObject({ companyId: "cmp_1", name: "Center" });
	});

	it("ListUnits lists across companies without a company and scopes otherwise", async () => {
		const { prisma } = prismaWith([{ companyId: "cmp_1", id: "u1" }]);
		expect(await new ListUnits(prisma).execute(null)).toHaveLength(1);
		expect(await new ListUnits(prisma).execute("cmp_1")).toHaveLength(1);
	});

	it("UpdateUnit rejects a unit from another company", async () => {
		const { prisma } = prismaWith([{ companyId: "cmp_1", id: "u1" }]);
		await expect(new UpdateUnit(prisma).execute("cmp_2", "u1", { name: "Y" })).rejects.toThrow(
			"UNIT_NOT_FOUND",
		);
	});

	it("UpdateUnit allows superAdmin (null company) to update a unit from any company", async () => {
		const { prisma } = prismaWith([{ companyId: "cmp_1", id: "u1" }]);
		const unit = await new UpdateUnit(prisma).execute(null, "u1", { name: "Y" });
		expect(unit).toMatchObject({ id: "u1", name: "Y" });
	});

	it("DeleteUnit removes a unit of the same company", async () => {
		const { deleted, prisma } = prismaWith([{ companyId: "cmp_1", id: "u1" }]);
		await new DeleteUnit(prisma).execute("cmp_1", "u1");
		expect(deleted).toEqual(["u1"]);
	});

	it("DeleteUnit allows superAdmin (null company) to delete a unit from any company", async () => {
		const { deleted, prisma } = prismaWith([{ companyId: "cmp_1", id: "u1" }]);
		await new DeleteUnit(prisma).execute(null, "u1");
		expect(deleted).toEqual(["u1"]);
	});
});
