import { describe, expect, it } from "bun:test";
import { setFeeModeSource } from "../companyFeeMode";
import { PaymentProviderError } from "@/shared/infra/paymentProviderError";
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

describe("fee mode gate on surcharges", () => {
	const fee = { active: true, applicationScope: "product", companyOverrides: [], createdAt: new Date(), deletedAt: null, displayMode: "checkout_only", fixedValue: 0, id: "fee", name: "Taxa", percentageValue: 400 };
	const prisma = { platformFee: { findMany: async () => [fee] } } as unknown as PrismaInstance;
	const useMode = (mode: "ADDITIVE_ONLY" | "BOTH" | "SIMINTPAY_ONLY") =>
		setFeeModeSource({ companyFees: async () => ({ costs: [], disabledLanes: [], lanes: [], mode, version: "1" }) });

	it("drops surcharges only when SimIntPay dictates SIMINTPAY_ONLY", async () => {
		useMode("SIMINTPAY_ONLY");
		expect(await listEffectiveFees(prisma, "company")).toEqual([]);
		for (const mode of ["ADDITIVE_ONLY", "BOTH"] as const) {
			useMode(mode);
			expect(await listEffectiveFees(prisma, "company")).toHaveLength(1);
		}
	});

	it("caches the mode and treats a company unknown to SimIntPay as additive-only", async () => {
		let calls = 0;
		setFeeModeSource({ companyFees: async () => (calls++, { costs: [], disabledLanes: [], lanes: [], mode: "SIMINTPAY_ONLY", version: "1" }) });
		await listEffectiveFees(prisma, "cached");
		await listEffectiveFees(prisma, "cached");
		expect(calls).toBe(1);
		setFeeModeSource({ companyFees: async () => { throw new PaymentProviderError("Simpay", "not found", 404); } });
		expect(await listEffectiveFees(prisma, "unknown")).toHaveLength(1);
	});

	it("fails instead of guessing the mode when SimIntPay is unavailable", async () => {
		setFeeModeSource({ companyFees: async () => { throw new PaymentProviderError("Simpay", "down", 503); } });
		await expect(listEffectiveFees(prisma, "company")).rejects.toThrow("down");
	});
});
