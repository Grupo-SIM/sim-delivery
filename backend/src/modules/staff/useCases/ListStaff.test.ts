import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ListStaff } from "./ListStaff";

function fakePrisma(capture: { orderBy?: unknown; where?: unknown } = {}) {
	return {
		user: {
			findMany: async ({ orderBy, where }: { orderBy: unknown; where: unknown }) => {
				capture.orderBy = orderBy;
				capture.where = where;
				return [
					{ createdAt: new Date(), email: "a@b.c", id: "u1", name: "Owner", role: "owner", staffUnits: [] },
				];
			},
		},
	} as unknown as PrismaInstance;
}

describe("ListStaff", () => {
	it("lists staff across all companies without a company (e.g. superAdmin)", async () => {
		const capture: { orderBy?: unknown; where?: unknown } = {};
		const staff = await new ListStaff(fakePrisma(capture)).execute(null);

		expect(staff).toHaveLength(1);
		expect(capture.where).toEqual({
			role: { in: ["owner", "manager", "attendant", "kitchen", "courier"] },
		});
		expect(capture.orderBy).toEqual({ name: "asc" });
	});

	it("scopes the query to the company and staff roles", async () => {
		const capture: { orderBy?: unknown; where?: unknown } = {};
		const staff = await new ListStaff(fakePrisma(capture)).execute("cmp_1");

		expect(staff).toHaveLength(1);
		expect(capture.where).toEqual({
			companyId: "cmp_1",
			role: { in: ["owner", "manager", "attendant", "kitchen", "courier"] },
		});
	});

	it("limits an operational-assignment listing to kitchen and courier staff", async () => {
		const capture: { orderBy?: unknown; where?: unknown } = {};
		await new ListStaff(fakePrisma(capture)).execute("cmp_1", ["kitchen", "courier"]);

		expect(capture.where).toEqual({
			companyId: "cmp_1",
			role: { in: ["kitchen", "courier"] },
		});
	});
});
