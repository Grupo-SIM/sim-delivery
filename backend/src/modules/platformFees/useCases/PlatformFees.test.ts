import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { listEffectiveFees } from "../effectiveFees";
import { PlatformFees } from "./PlatformFees";

describe("platform fee inheritance", () => {
	it("applies global values, company overrides and company deactivation", async () => {
		const prisma = {
			platformFee: {
				findMany: async () => [
					{
						active: true,
						applicationScope: "product",
						companyOverrides: [{ active: true, companyId: "company", fixedOverride: null, percentageOverride: 350 }],
						displayMode: "checkout_only",
						fixedValue: 100,
						id: "overridden",
						name: "Serviço",
						percentageValue: 200,
					},
					{
						active: true,
						applicationScope: "order",
						companyOverrides: [{ active: false, companyId: "company", fixedOverride: null, percentageOverride: null }],
						displayMode: "checkout_only",
						fixedValue: 100,
						id: "disabled",
						name: "Operação",
						percentageValue: 0,
					},
				],
			},
		} as unknown as PrismaInstance;

		expect(await listEffectiveFees(prisma, "company")).toEqual([
			expect.objectContaining({ fixedValue: 100, id: "overridden", percentageValue: 350 }),
		]);
	});

	it("restores inheritance by deleting only the company override", async () => {
		let receivedWhere: unknown;
		const prisma = {
			companyFeeOverride: {
				deleteMany: async ({ where }: { where: unknown }) => {
					receivedWhere = where;
					return { count: 1 };
				},
			},
		} as unknown as PrismaInstance;

		await new PlatformFees(prisma).resetCompany("fee", "company");
		expect(receivedWhere).toEqual({ companyId: "company", feeId: "fee" });
	});

	it("soft-deletes a global fee without removing historical rows", async () => {
		let data: Record<string, unknown> | undefined;
		const prisma = {
			platformFee: {
				updateMany: async (input: { data: Record<string, unknown> }) => {
					data = input.data;
					return { count: 1 };
				},
			},
		} as unknown as PrismaInstance;

		await new PlatformFees(prisma).remove("fee");
		expect(data?.active).toBe(false);
		expect(data?.deletedAt).toBeInstanceOf(Date);
	});
});
