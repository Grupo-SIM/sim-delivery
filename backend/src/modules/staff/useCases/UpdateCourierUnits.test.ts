import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { UpdateCourierUnits } from "./UpdateCourierUnits";

function fakePrisma(unitCount: number) {
	const created: Array<{ courierId: string; unitId: string }> = [];
	const deleted: string[] = [];
	return {
		created,
		deleted,
		prisma: {
			$transaction: async (operations: unknown[]) => Promise.all(operations as Promise<unknown>[]),
			courierUnit: {
				createMany: async ({ data }: { data: Array<{ courierId: string; unitId: string }> }) => {
					created.push(...data);
					return { count: data.length };
				},
				deleteMany: async ({ where }: { where: { courierId: string } }) => {
					deleted.push(where.courierId);
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

describe("UpdateCourierUnits", () => {
	it("replaces courier's company-scoped unit links", async () => {
		const { created, deleted, prisma } = fakePrisma(2);
		const courier = await new UpdateCourierUnits(prisma).execute({
			companyId: "cmp_1",
			courierId: "courier_1",
			unitIds: ["unit_1", "unit_2"],
		});

		expect(courier.unitIds).toEqual(["unit_1", "unit_2"]);
		expect(deleted).toEqual(["courier_1"]);
		expect(created).toEqual([
			{ courierId: "courier_1", unitId: "unit_1" },
			{ courierId: "courier_1", unitId: "unit_2" },
		]);
	});

	it("rejects a unit outside courier company", async () => {
		const { prisma } = fakePrisma(1);
		await expect(
			new UpdateCourierUnits(prisma).execute({
				companyId: "cmp_1",
				courierId: "courier_1",
				unitIds: ["unit_1", "unit_2"],
			}),
		).rejects.toThrow("UNIT_NOT_FOUND");
	});
});
