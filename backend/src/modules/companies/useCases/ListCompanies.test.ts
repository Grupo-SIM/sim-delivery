import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ListCompanies } from "./ListCompanies";

interface CompanyRow {
	id: string;
	name: string;
	slug: string;
	createdAt: Date;
	updatedAt: Date;
}

describe("ListCompanies", () => {
	it("returns companies newest-first", async () => {
		const older: CompanyRow = {
			createdAt: new Date(1),
			id: "a",
			name: "A",
			slug: "a",
			updatedAt: new Date(1),
		};
		const newer: CompanyRow = {
			createdAt: new Date(2),
			id: "b",
			name: "B",
			slug: "b",
			updatedAt: new Date(2),
		};

		let capturedOrder: unknown;
		const prisma = {
			company: {
				findMany: async ({ orderBy }: { orderBy: unknown }) => {
					capturedOrder = orderBy;
					return [newer, older];
				},
			},
		} as unknown as PrismaInstance;

		const companies = await new ListCompanies(prisma).execute();

		expect(companies).toHaveLength(2);
		expect(companies[0]?.id).toBe("b");
		expect(capturedOrder).toEqual({ createdAt: "desc" });
	});
});
