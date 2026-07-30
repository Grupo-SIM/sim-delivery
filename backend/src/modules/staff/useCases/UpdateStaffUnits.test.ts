import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { UpdateStaffUnits } from "./UpdateStaffUnits";

function fakePrisma(unitCount: number) {
	const created: Array<{ userId: string; unitId: string }> = [];
	const deleted: string[] = [];
	return {
		created,
		deleted,
		prisma: {
			$transaction: async (operations: unknown[]) => Promise.all(operations as Promise<unknown>[]),
			staffUnit: {
		createMany: async ({ data }: { data: Array<{ userId: string; unitId: string }> }) => {
					created.push(...data);
					return { count: data.length };
				},
				deleteMany: async ({ where }: { where: { userId: string } }) => {
			deleted.push(where.userId);
					return { count: 1 };
				},
			},
			unit: {
				findMany: async () => Array.from({ length: unitCount }, (_, index) => ({ id: `unit_${index + 1}` })),
			},
			user: {
				findFirst: async () => ({
					createdAt: new Date(),
					email: "courier@example.com",
					id: "courier_1",
					name: "Courier",
					role: "courier",
				}),
			},
		} as unknown as PrismaInstance,
	};
}

describe("UpdateStaffUnits", () => {
	it("replaces courier's company-scoped unit links", async () => {
		const { created, deleted, prisma } = fakePrisma(2);
		const courier = await new UpdateStaffUnits(prisma).execute({
			companyId: "cmp_1",
			staffId: "courier_1",
			unitIds: ["unit_1", "unit_2"],
		});

		expect(courier.unitIds).toEqual(["unit_1", "unit_2"]);
		expect(deleted).toEqual(["courier_1"]);
		expect(created).toEqual([
			{ userId: "courier_1", unitId: "unit_1" },
			{ userId: "courier_1", unitId: "unit_2" },
		]);
	});

	it("rejects a unit outside courier company", async () => {
		const { prisma } = fakePrisma(1);
		await expect(
			new UpdateStaffUnits(prisma).execute({
				companyId: "cmp_1",
				staffId: "courier_1",
				unitIds: ["unit_1", "unit_2"],
			}),
		).rejects.toThrow("UNIT_NOT_FOUND");
	});
});
