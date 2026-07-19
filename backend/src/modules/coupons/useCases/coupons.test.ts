import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CreateCoupon } from "./CreateCoupon";
import { DeleteCoupon } from "./DeleteCoupon";
import { ListCoupons } from "./ListCoupons";
import { UpdateCoupon } from "./UpdateCoupon";
import { ValidateCoupon } from "./ValidateCoupon";

const baseCompany = { id: "cmp_1", slug: "demo" };

function makePrisma(
	opts: { company?: typeof baseCompany | null; coupon?: Record<string, unknown> | null } = {},
) {
	const { company = baseCompany, coupon = null } = opts;

	return {
		prisma: {
			company: {
				findUnique: async ({ where }: { where: { slug?: string } }) =>
					company?.slug === where.slug ? company : null,
			},
			coupon: {
				findUnique: async ({ where }: { where: { companyId_code: { companyId: string; code: string } } }) => {
					if (!coupon) return null;
					const {
						companyId_code: { companyId, code },
					} = where;
					return (coupon as any).companyId === companyId && (coupon as any).code === code ? coupon : null;
				},
			},
		} as unknown as PrismaInstance,
	};
}

const baseBody = { code: "SAVE10", orderSubtotal: 5000, slug: "demo", unitId: "unit_1" };

const baseCoupon = {
	code: "SAVE10",
	companyId: "cmp_1",
	expiresAt: null,
	id: "cpn_1",
	maxUses: null,
	minOrderCents: 0,
	type: "percent",
	unitId: null,
	usedCount: 0,
	value: 10,
};

describe("ValidateCoupon", () => {
	it("throws COMPANY_NOT_FOUND for unknown slug", async () => {
		const { prisma } = makePrisma({ company: null });
		await expect(new ValidateCoupon(prisma).execute(baseBody)).rejects.toThrow("COMPANY_NOT_FOUND");
	});

	it("throws COUPON_NOT_FOUND for unknown code", async () => {
		const { prisma } = makePrisma({ coupon: null });
		await expect(new ValidateCoupon(prisma).execute(baseBody)).rejects.toThrow("COUPON_NOT_FOUND");
	});

	it("throws COUPON_NOT_FOUND when coupon is scoped to different unit", async () => {
		const { prisma } = makePrisma({ coupon: { ...baseCoupon, unitId: "unit_other" } });
		await expect(new ValidateCoupon(prisma).execute(baseBody)).rejects.toThrow("COUPON_NOT_FOUND");
	});

	it("throws COUPON_EXPIRED when expiresAt is in the past", async () => {
		const past = new Date(Date.now() - 1000);
		const { prisma } = makePrisma({ coupon: { ...baseCoupon, expiresAt: past } });
		await expect(new ValidateCoupon(prisma).execute(baseBody)).rejects.toThrow("COUPON_EXPIRED");
	});

	it("throws COUPON_EXHAUSTED when maxUses reached", async () => {
		const { prisma } = makePrisma({ coupon: { ...baseCoupon, maxUses: 5, usedCount: 5 } });
		await expect(new ValidateCoupon(prisma).execute(baseBody)).rejects.toThrow("COUPON_EXHAUSTED");
	});

	it("throws ORDER_TOO_SMALL when subtotal < minOrderCents", async () => {
		const { prisma } = makePrisma({ coupon: { ...baseCoupon, minOrderCents: 10000 } });
		await expect(new ValidateCoupon(prisma).execute(baseBody)).rejects.toThrow("ORDER_TOO_SMALL");
	});

	it("computes percent discount correctly", async () => {
		const { prisma } = makePrisma({ coupon: baseCoupon });
		const result = await new ValidateCoupon(prisma).execute(baseBody);
		expect(result).toMatchObject({ discountCents: 500, type: "percent", value: 10 });
	});

	it("computes fixed discount correctly", async () => {
		const { prisma } = makePrisma({ coupon: { ...baseCoupon, type: "fixed", value: 1000 } });
		const result = await new ValidateCoupon(prisma).execute(baseBody);
		expect(result).toMatchObject({ discountCents: 1000, type: "fixed", value: 1000 });
	});

	it("caps fixed discount at orderSubtotal", async () => {
		const { prisma } = makePrisma({ coupon: { ...baseCoupon, type: "fixed", value: 9999 } });
		const result = await new ValidateCoupon(prisma).execute({ ...baseBody, orderSubtotal: 1000 });
		expect(result.discountCents).toBe(1000);
	});

	it("accepts code case-insensitively", async () => {
		const { prisma } = makePrisma({ coupon: baseCoupon });
		const result = await new ValidateCoupon(prisma).execute({ ...baseBody, code: "save10" });
		expect(result.discountCents).toBe(500);
	});
});

describe("coupon administration", () => {
	it("requires a company scope to create, list, update, or delete", async () => {
		const { prisma } = makePrisma();
		const data = { code: "SAVE10", type: "percent" as const, value: 10 };

		await expect(new CreateCoupon(prisma).execute(null, data)).rejects.toThrow("NO_COMPANY");
		await expect(new ListCoupons(prisma).execute(null)).rejects.toThrow("NO_COMPANY");
		await expect(new UpdateCoupon(prisma).execute(null, "coupon_1", data)).rejects.toThrow("NO_COMPANY");
		await expect(new DeleteCoupon(prisma).execute(null, "coupon_1")).rejects.toThrow("NO_COMPANY");
	});

	it("lists coupons only inside current company", async () => {
		let companyId: string | undefined;
		const prisma = {
			coupon: {
				findMany: async ({ where }: { where: { companyId: string } }) => {
					companyId = where.companyId;
					return [];
				},
			},
		} as unknown as PrismaInstance;

		await new ListCoupons(prisma).execute("cmp_1");
		expect(companyId).toBe("cmp_1");
	});
});
