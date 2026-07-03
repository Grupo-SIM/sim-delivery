import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { SetUnitHoursBody } from "../dtos";
import { GetUnitHours } from "./GetUnitHours";
import { SetUnitHours } from "./SetUnitHours";

function prismaWith(
	units: Array<{ id: string; companyId: string }>,
	hours: Array<{ unitId: string; weekday: number }> = [],
) {
	const upserts: unknown[] = [];
	const store = [...hours];
	return {
		prisma: {
			unit: {
				findFirst: async ({ where }: { where: { companyId: string | null; id: string } }) =>
					units.find(u => u.companyId === where.companyId && u.id === where.id) ?? null,
			},
			unitHours: {
				findMany: async ({ where }: { where: { unitId: string } }) =>
					store.filter(h => h.unitId === where.unitId).sort((a, b) => a.weekday - b.weekday),
				upsert: async ({ create }: { create: { unitId: string; weekday: number } }) => {
					upserts.push(create);
					store.push(create);
					return create;
				},
			},
		} as unknown as PrismaInstance,
		upserts,
	};
}

const day = (weekday: number): SetUnitHoursBody["hours"][number] => ({
	closed: false,
	closesAt: "18:00",
	opensAt: "09:00",
	weekday,
});

describe("unit-hours use-cases", () => {
	it("GetUnitHours rejects a unit from another company", async () => {
		const { prisma } = prismaWith([{ companyId: "cmp_1", id: "u1" }]);
		await expect(new GetUnitHours(prisma).execute("cmp_2", "u1")).rejects.toThrow("UNIT_NOT_FOUND");
	});

	it("GetUnitHours returns the unit's weekday rows in order", async () => {
		const { prisma } = prismaWith(
			[{ companyId: "cmp_1", id: "u1" }],
			[
				{ unitId: "u1", weekday: 3 },
				{ unitId: "u1", weekday: 1 },
			],
		);
		const result = await new GetUnitHours(prisma).execute("cmp_1", "u1");
		expect(result.map(h => h.weekday)).toEqual([1, 3]);
	});

	it("SetUnitHours requires the unit to belong to the company", async () => {
		const { prisma } = prismaWith([{ companyId: "cmp_1", id: "u1" }]);
		await expect(new SetUnitHours(prisma).execute(null, "u1", [day(0)])).rejects.toThrow("UNIT_NOT_FOUND");
	});

	it("SetUnitHours upserts one row per provided weekday", async () => {
		const { prisma, upserts } = prismaWith([{ companyId: "cmp_1", id: "u1" }]);
		const result = await new SetUnitHours(prisma).execute("cmp_1", "u1", [day(0), day(1)]);
		expect(upserts).toHaveLength(2);
		expect(result.map(h => h.weekday)).toEqual([0, 1]);
	});
});
