import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ListPublicMenu } from "./ListPublicMenu";

type Assoc = {
	available: boolean;
	cashbackPercentOverride: number | null;
	category: { id: string; name: string; position: number } | null;
	id: string;
	priceCentsOverride: number | null;
	product: {
		basePriceCents: number;
		cashbackPercentOverride: number | null;
		description: string;
		id: string;
		imageUrl: string;
		title: string;
	};
	unitId: string;
};

function prismaWith(unit: { id: string } | null, associations: Assoc[] = []) {
	return {
		unit: {
			findUnique: async ({ where }: { where: { id: string } }) =>
				unit && unit.id === where.id ? unit : null,
		},
		unitProduct: {
			findMany: async ({ where }: { where: { available: boolean; unitId: string } }) =>
				associations.filter(a => a.unitId === where.unitId && a.available === where.available),
		},
	} as unknown as PrismaInstance;
}

const product = (id: string, over: Partial<Assoc["product"]> = {}): Assoc["product"] => ({
	basePriceCents: 1000,
	cashbackPercentOverride: null,
	description: "",
	id,
	imageUrl: "https://x/img.jpg",
	title: id,
	...over,
});

describe("ListPublicMenu", () => {
	it("returns [] for a missing unit", async () => {
		const prisma = prismaWith(null);
		expect(await new ListPublicMenu(prisma).execute("nope")).toEqual([]);
	});

	it("resolves per-unit price/cashback overrides, base otherwise", async () => {
		const prisma = prismaWith({ id: "u1" }, [
			{
				available: true,
				cashbackPercentOverride: 7,
				category: { id: "cat1", name: "Salgados", position: 0 },
				id: "up1",
				priceCentsOverride: 1500,
				product: product("p1", { cashbackPercentOverride: 3 }),
				unitId: "u1",
			},
			{
				available: true,
				cashbackPercentOverride: null,
				category: { id: "cat1", name: "Salgados", position: 0 },
				id: "up2",
				priceCentsOverride: null,
				product: product("p2", { basePriceCents: 800, cashbackPercentOverride: 2 }),
				unitId: "u1",
			},
		]);
		const result = await new ListPublicMenu(prisma).execute("u1");
		expect(result).toHaveLength(1);
		expect(result[0].items).toEqual([
			expect.objectContaining({ cashbackPercent: 7, id: "up1", priceCents: 1500 }),
			expect.objectContaining({ cashbackPercent: 2, id: "up2", priceCents: 800 }),
		]);
	});

	it("orders sections by category position with the loose group last", async () => {
		const prisma = prismaWith({ id: "u1" }, [
			{
				available: true,
				cashbackPercentOverride: null,
				category: null,
				id: "up-loose",
				priceCentsOverride: null,
				product: product("loose"),
				unitId: "u1",
			},
			{
				available: true,
				cashbackPercentOverride: null,
				category: { id: "cat2", name: "Bebidas", position: 1 },
				id: "up-b",
				priceCentsOverride: null,
				product: product("b"),
				unitId: "u1",
			},
			{
				available: true,
				cashbackPercentOverride: null,
				category: { id: "cat1", name: "Salgados", position: 0 },
				id: "up-s",
				priceCentsOverride: null,
				product: product("s"),
				unitId: "u1",
			},
		]);
		const result = await new ListPublicMenu(prisma).execute("u1");
		expect(result.map(s => s.categoryName)).toEqual(["Salgados", "Bebidas", null]);
	});
});
