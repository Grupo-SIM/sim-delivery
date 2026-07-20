import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ListPublicUnits } from "./ListPublicUnits";

function prismaWith(
	company: { id: string; slug: string } | null,
	units: Array<{
		bannerUrl?: string | null;
		companyId: string;
		id: string;
		imageUrl?: string | null;
		isOpenManual: boolean | null;
		hours?: Array<{
			closed: boolean;
			closesAt: string | null;
			opensAt: string | null;
			weekday: number;
		}>;
		slug: string;
	}> = [],
) {
	return {
		company: {
			findUnique: async ({ where }: { where: { slug: string } }) =>
				company && company.slug === where.slug ? company : null,
		},
		review: {
			findMany: async () => [],
		},
		unit: {
			findMany: async ({ where }: { where: { companyId: string } }) =>
				units
					.filter(unit => unit.companyId === where.companyId)
					.map(unit => ({ ...unit, hours: unit.hours ?? [], promotionalImages: [] })),
		},
	} as unknown as PrismaInstance;
}

describe("ListPublicUnits", () => {
	it("returns [] without a slug", async () => {
		const prisma = prismaWith({ id: "c1", slug: "bliss" });
		expect(await new ListPublicUnits(prisma).execute(undefined)).toEqual([]);
	});

	it("returns [] for an unknown slug", async () => {
		const prisma = prismaWith({ id: "c1", slug: "bliss" });
		expect(await new ListPublicUnits(prisma).execute("nope")).toEqual([]);
	});

	it("returns only the matched company's units with computed status", async () => {
		const prisma = prismaWith({ id: "c1", slug: "bliss" }, [
			{
				bannerUrl: "https://example.com/ipes.png",
				companyId: "c1",
				hours: [{ closed: false, closesAt: "18:00", opensAt: "09:00", weekday: 5 }],
				id: "u1",
				imageUrl: "https://example.com/ipes-unit.png",
				isOpenManual: true,
				slug: "ipes",
			},
			{ companyId: "c2", id: "u2", isOpenManual: true, slug: "centro" },
		]);
		const result = await new ListPublicUnits(prisma).execute("bliss");
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			bannerUrl: "https://example.com/ipes.png",
			hours: [{ closed: false, closesAt: "18:00", opensAt: "09:00", weekday: 5 }],
			id: "u1",
			imageUrl: "https://example.com/ipes-unit.png",
			isOpenNow: true,
			promotionalImages: [],
			ratingAverage: null,
			ratingCount: 0,
			slug: "ipes",
		});
	});
});
