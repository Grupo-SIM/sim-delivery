import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { SimulateFreight } from "./SimulateFreight";

interface Zone {
	radiusKm: number;
	fee: number;
	etaMinMinutes?: number | null;
	etaMaxMinutes?: number | null;
}

interface UnitOpts {
	deliveryFee: number;
	deliveryFeeFallbackEnabled?: boolean;
	deliveryZones?: Zone[];
	latitude?: number | null;
	longitude?: number | null;
}

function makeFreightPrisma(
	opts: { company?: { id: string; slug: string } | null; unit?: UnitOpts | null } = {},
) {
	const { company = { id: "cmp_1", slug: "demo" }, unit = { deliveryFee: 500 } } = opts;

	const unitRow = unit && {
		deliveryFee: unit.deliveryFee,
		deliveryFeeFallbackEnabled: unit.deliveryFeeFallbackEnabled ?? true,
		deliveryZones: unit.deliveryZones ?? [],
		latitude: unit.latitude ?? null,
		longitude: unit.longitude ?? null,
	};

	return {
		prisma: {
			company: {
				findUnique: async ({ where }: { where: { slug?: string } }) =>
					company?.slug === where.slug ? company : null,
			},
			unit: {
				findFirst: async ({ where }: { where: { companyId: string; id: string } }) =>
					company && unitRow && where.companyId === company.id ? unitRow : null,
			},
		} as unknown as PrismaInstance,
	};
}

const STORE = { latitude: -23.55, longitude: -46.63 };
const NEARBY = { latitude: -23.551, longitude: -46.631 };
const FAR_AWAY = { latitude: -22.9, longitude: -43.2 };

describe("SimulateFreight", () => {
	it("throws NO_COMPANY when slug unknown", async () => {
		const { prisma } = makeFreightPrisma({ company: null });
		await expect(
			new SimulateFreight(prisma).execute({ slug: "unknown", unitId: "unit_1", ...NEARBY }),
		).rejects.toThrow("NO_COMPANY");
	});

	it("throws UNIT_NOT_FOUND when unit not in company", async () => {
		const { prisma } = makeFreightPrisma({ unit: null });
		await expect(
			new SimulateFreight(prisma).execute({ slug: "demo", unitId: "unit_missing", ...NEARBY }),
		).rejects.toThrow("UNIT_NOT_FOUND");
	});

	it("falls back to the flat deliveryFee when the unit has no coordinates", async () => {
		const { prisma } = makeFreightPrisma({ unit: { deliveryFee: 500 } });
		const result = await new SimulateFreight(prisma).execute({ slug: "demo", unitId: "unit_1", ...NEARBY });
		expect(result).toEqual({ deliveryFee: 500, distanceKm: undefined });
	});

	it("returns the matching zone's fee and eta when the distance is within a zone", async () => {
		const { prisma } = makeFreightPrisma({
			unit: {
				deliveryFee: 999,
				deliveryZones: [
					{ etaMaxMinutes: 30, etaMinMinutes: 20, fee: 500, radiusKm: 3 },
					{ etaMaxMinutes: 50, etaMinMinutes: 30, fee: 800, radiusKm: 8 },
				],
				...STORE,
			},
		});

		const result = await new SimulateFreight(prisma).execute({ slug: "demo", unitId: "unit_1", ...NEARBY });

		expect(result.deliveryFee).toBe(500);
		expect(result.etaMinMinutes).toBe(20);
		expect(result.etaMaxMinutes).toBe(30);
		expect(result.distanceKm).toBeLessThan(3);
	});

	it("falls back to the flat deliveryFee when the distance exceeds every zone and fallback is enabled", async () => {
		const { prisma } = makeFreightPrisma({
			unit: {
				deliveryFee: 999,
				deliveryFeeFallbackEnabled: true,
				deliveryZones: [{ fee: 500, radiusKm: 3 }],
				...STORE,
			},
		});

		const result = await new SimulateFreight(prisma).execute({ slug: "demo", unitId: "unit_1", ...FAR_AWAY });

		expect(result.deliveryFee).toBe(999);
		expect(result.etaMinMinutes).toBeUndefined();
	});

	it("throws OUT_OF_DELIVERY_RANGE when the distance exceeds every zone and fallback is disabled", async () => {
		const { prisma } = makeFreightPrisma({
			unit: {
				deliveryFee: 999,
				deliveryFeeFallbackEnabled: false,
				deliveryZones: [{ fee: 500, radiusKm: 3 }],
				...STORE,
			},
		});

		await expect(
			new SimulateFreight(prisma).execute({ slug: "demo", unitId: "unit_1", ...FAR_AWAY }),
		).rejects.toThrow("OUT_OF_DELIVERY_RANGE");
	});

	it("returns 0 when unit has no delivery fee and no zones", async () => {
		const { prisma } = makeFreightPrisma({ unit: { deliveryFee: 0 } });
		const result = await new SimulateFreight(prisma).execute({ slug: "demo", unitId: "unit_1", ...NEARBY });
		expect(result.deliveryFee).toBe(0);
	});
});
