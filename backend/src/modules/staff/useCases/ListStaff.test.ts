import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ListStaff } from "./ListStaff";

function fakePrisma(capture: { where?: unknown } = {}) {
	return {
		user: {
			findMany: async ({ where }: { where: unknown }) => {
				capture.where = where;
				return [
					{ courierUnits: [], createdAt: new Date(), email: "a@b.c", id: "u1", name: "Owner", role: "owner" },
				];
			},
		},
	} as unknown as PrismaInstance;
}

describe("ListStaff", () => {
	it("lists staff across all companies without a company (e.g. superAdmin)", async () => {
		const capture: { where?: unknown } = {};
		const staff = await new ListStaff(fakePrisma(capture)).execute(null);

		expect(staff).toHaveLength(1);
		expect(capture.where).toEqual({
			role: { in: ["owner", "manager", "attendant", "kitchen", "courier"] },
		});
	});

	it("scopes the query to the company and staff roles", async () => {
		const capture: { where?: unknown } = {};
		const staff = await new ListStaff(fakePrisma(capture)).execute("cmp_1");

		expect(staff).toHaveLength(1);
		expect(capture.where).toEqual({
			companyId: "cmp_1",
			role: { in: ["owner", "manager", "attendant", "kitchen", "courier"] },
		});
	});
});
