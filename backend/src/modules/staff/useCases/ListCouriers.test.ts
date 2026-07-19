import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ListCouriers } from "./ListCouriers";

describe("ListCouriers", () => {
	it("lists only company couriers with their assigned units", async () => {
		const capture: { where?: unknown } = {};
		const prisma = {
			user: {
				findMany: async ({ where }: { where: unknown }) => {
					capture.where = where;
					return [
						{
							courierUnits: [{ unitId: "unit_1" }],
							createdAt: new Date(),
							email: "courier@example.com",
							id: "courier_1",
							name: "Courier",
							role: "courier",
						},
					];
				},
			},
		} as unknown as PrismaInstance;

		const couriers = await new ListCouriers(prisma).execute("cmp_1");

		expect(capture.where).toEqual({ companyId: "cmp_1", role: "courier" });
		expect(couriers).toMatchObject([{ id: "courier_1", unitIds: ["unit_1"] }]);
	});
});
