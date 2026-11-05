import { beforeEach, describe, expect, it } from "bun:test";
import { setFeeModeSource } from "@/modules/platformFees/companyFeeMode";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ListPublicUnits } from "./ListPublicUnits";

function prismaWith(
	company: { id: string; slug: string } | null,
	units: Array<{
		bannerLinks?: string[];
		bannerUrls?: string[];
		companyId: string;
		id: string;
		imageUrl?: string | null;
		isOpenManual: boolean | null;
		whatsApp?: string | null;
		whatsAppConnection?: { connectedPhone: string | null } | null;
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
		order: {
			findMany: async () => [],
		},
		review: {
			groupBy: async () => [],
		},
		unit: {
			findMany: async ({ where }: { where: { companyId: string } }) =>
				units
					.filter(unit => unit.companyId === where.companyId)
					.map(unit => ({
						...unit,
						bannerLinks: unit.bannerLinks ?? [],
						bannerUrls: unit.bannerUrls ?? [],
						hours: unit.hours ?? [],
						promotionalImages: [],
						whatsAppConnection: unit.whatsAppConnection ?? null,
					})),
		},
	} as unknown as PrismaInstance;
}

describe("ListPublicUnits", () => {
	beforeEach(() => setFeeModeSource({ companyFees: async () => ({ costs: [], disabledLanes: [], lanes: [], mode: "ADDITIVE_ONLY", version: "1" }) }));

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
				bannerLinks: ["/?product=p1"],
				bannerUrls: ["https://example.com/ipes.png", "https://example.com/ipes-2.png"],
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
			bannerLinks: ["/?product=p1", ""],
			bannerUrls: ["https://example.com/ipes.png", "https://example.com/ipes-2.png"],
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

	it("uses the connected number only when no public WhatsApp was configured", async () => {
		const prisma = prismaWith({ id: "c1", slug: "bliss" }, [
			{
				companyId: "c1",
				id: "u1",
				isOpenManual: true,
				slug: "centro",
				whatsApp: null,
				whatsAppConnection: { connectedPhone: "+5581999999999" },
			},
			{
				companyId: "c1",
				id: "u2",
				isOpenManual: true,
				slug: "norte",
				whatsApp: "+5581888888888",
				whatsAppConnection: { connectedPhone: "+5581777777777" },
			},
		]);

		const result = await new ListPublicUnits(prisma).execute("bliss");

		expect(result.map(unit => unit.whatsApp)).toEqual(["+5581999999999", "+5581888888888"]);
	});
});
