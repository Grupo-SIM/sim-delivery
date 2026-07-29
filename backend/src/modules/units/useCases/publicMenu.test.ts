import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ListPublicMenu } from "./ListPublicMenu";

interface Assoc {
	available: boolean;
	cashbackPercentOverride: number | null;
	categories: { category: { id: string; name: string; position: number } }[];
	categoriesOverridden: boolean;
	tags: { tag: { color: string; id: string; name: string } }[];
	tagsOverridden: boolean;
	featuredRank: number | null;
	id: string;
	priceCentsOverride: number | null;
	product: {
		basePriceCents: number;
		cashbackPercentOverride: number | null;
		description: string;
		id: string;
		imageUrl: string;
		categories: { category: { id: string; name: string; position: number } }[];
		tags: { tag: { color: string; id: string; name: string } }[];
		optionGroups: {
			id: string;
			maxSelect: number;
			required: boolean;
			name: string;
			options: {
				description: string;
				id: string;
				imageUrl: string | null;
				maxPerItem: number | null;
				name: string;
				popularity: number;
				priceDeltaCents: number;
			}[];
			priceRule: string;
			selectionType: string;
			sortOrder: number;
		}[];
		popularity: number;
		slug: string;
		title: string;
	};
	unitId: string;
	excludedOptionIds?: string[];
}

function prismaWith(unit: { id: string; slug: string } | null, associations: Assoc[] = []) {
	return {
		company: {
			findUnique: async ({ where }: { where: { slug: string } }) =>
				where.slug === "demo" ? { id: "c1" } : null,
		},
		productReview: {
			groupBy: async () => [],
		},
		productRecipeIngredient: { findMany: async () => [] },
		unit: {
			findFirst: async ({
				where,
			}: {
				where: { active: boolean; companyId: string; slug: string };
			}) => (unit && where.active && where.companyId === "c1" && unit.slug === where.slug ? unit : null),
		},
		unitProduct: {
			findMany: async ({ where }: { where: { available: boolean; unitId: string } }) =>
				associations.filter(a => a.unitId === where.unitId && a.available === where.available),
		},
		unitProductExcludedOption: {
			findMany: async ({ where }: { where: { unitProductId: { in: string[] } } }) =>
				associations
					.flatMap(association =>
						(association.excludedOptionIds ?? []).map(optionId => ({
							optionId,
							unitProductId: association.id,
						})),
					)
					.filter(exclusion => where.unitProductId.in.includes(exclusion.unitProductId)),
		},
		unitInventoryBalance: { findMany: async () => [] },
	} as unknown as PrismaInstance;
}

const product = (id: string, over: Partial<Assoc["product"]> = {}): Assoc["product"] => ({
	basePriceCents: 1000,
	cashbackPercentOverride: null,
	categories: [],
	description: "",
	id,
	imageUrl: "https://x/img.jpg",
	optionGroups: [],
	popularity: 0,
	slug: id,
	tags: [],
	title: id,
	...over,
});

describe("ListPublicMenu", () => {
	it("returns [] for a missing unit", async () => {
		const prisma = prismaWith(null);
		expect(await new ListPublicMenu(prisma).execute("demo", "nope")).toEqual([]);
	});

	it("resolves per-unit price/cashback overrides, base otherwise", async () => {
		const prisma = prismaWith({ id: "u1", slug: "ipês" }, [
			{
				available: true,
				cashbackPercentOverride: 7,
				categories: [{ category: { id: "cat1", name: "Salgados", position: 0 } }],
				categoriesOverridden: true,
				featuredRank: null,
				id: "up1",
				priceCentsOverride: 1500,
				product: product("p1", { cashbackPercentOverride: 3 }),
				tags: [],
				tagsOverridden: true,
				unitId: "u1",
			},
			{
				available: true,
				cashbackPercentOverride: null,
				categories: [{ category: { id: "cat1", name: "Salgados", position: 0 } }],
				categoriesOverridden: true,
				featuredRank: null,
				id: "up2",
				priceCentsOverride: null,
				product: product("p2", { basePriceCents: 800, cashbackPercentOverride: 2 }),
				tags: [],
				tagsOverridden: true,
				unitId: "u1",
			},
		]);
		const result = await new ListPublicMenu(prisma).execute("demo", "ipês");
		expect(result).toHaveLength(1);
		expect(result[0].items).toEqual([
			expect.objectContaining({ cashbackPercent: 7, id: "up1", priceCents: 1500 }),
			expect.objectContaining({ cashbackPercent: 2, id: "up2", priceCents: 800 }),
		]);
	});

	it("orders sections by category position with the loose group last", async () => {
		const prisma = prismaWith({ id: "u1", slug: "ipês" }, [
			{
				available: true,
				cashbackPercentOverride: null,
				categories: [],
				categoriesOverridden: true,
				featuredRank: null,
				id: "up-loose",
				priceCentsOverride: null,
				product: product("loose"),
				tags: [],
				tagsOverridden: true,
				unitId: "u1",
			},
			{
				available: true,
				cashbackPercentOverride: null,
				categories: [{ category: { id: "cat2", name: "Bebidas", position: 1 } }],
				categoriesOverridden: true,
				featuredRank: null,
				id: "up-b",
				priceCentsOverride: null,
				product: product("b"),
				tags: [],
				tagsOverridden: true,
				unitId: "u1",
			},
			{
				available: true,
				cashbackPercentOverride: null,
				categories: [{ category: { id: "cat1", name: "Salgados", position: 0 } }],
				categoriesOverridden: true,
				featuredRank: null,
				id: "up-s",
				priceCentsOverride: null,
				product: product("s"),
				tags: [],
				tagsOverridden: true,
				unitId: "u1",
			},
		]);
		const result = await new ListPublicMenu(prisma).execute("demo", "ipês");
		expect(result.map(s => s.categoryName)).toEqual(["Salgados", "Bebidas", null]);
	});

	it("computes fromPriceCents as base + min required option deltas", async () => {
		const optionGroup = (required: boolean, options: { priceDeltaCents: number }[]) => ({
			id: "g1",
			maxSelect: 1,
			name: "Sabor",
			options: options.map((o, i) => ({
				description: "",
				id: `o${i}`,
				imageUrl: null,
				maxPerItem: null,
				name: `opt${i}`,
				popularity: 0,
				priceDeltaCents: o.priceDeltaCents,
			})),
			priceRule: "highest",
			required,
			selectionType: "single",
			sortOrder: 0,
		});

		const prisma = prismaWith({ id: "u1", slug: "ipês" }, [
			{
				available: true,
				cashbackPercentOverride: null,
				categories: [],
				categoriesOverridden: true,
				featuredRank: null,
				id: "up1",
				priceCentsOverride: null,
				product: product("p1", {
					basePriceCents: 4800,
					optionGroups: [optionGroup(true, [{ priceDeltaCents: 200 }, { priceDeltaCents: 800 }])],
				}),
				tags: [],
				tagsOverridden: true,
				unitId: "u1",
			},
			{
				available: true,
				cashbackPercentOverride: null,
				categories: [],
				categoriesOverridden: true,
				featuredRank: 1,
				id: "up2",
				priceCentsOverride: null,
				product: product("p2", { optionGroups: [] }),
				tags: [],
				tagsOverridden: true,
				unitId: "u1",
			},
		]);
		const result = await new ListPublicMenu(prisma).execute("demo", "ipês");
		const items = result[0].items;
		// p1: 4800 + cheapest required group delta (200) = 5000
		expect(items.find(i => i.id === "up1")).toMatchObject({ fromPriceCents: 5000, priceCents: 4800 });
		// p2: no required groups, fromPriceCents == priceCents
		expect(items.find(i => i.id === "up2")).toMatchObject({ featuredRank: 1, fromPriceCents: 1000 });
		// optionGroups are mapped correctly
		expect(items.find(i => i.id === "up1")?.optionGroups).toHaveLength(1);
	});

	it("hides excluded options and omits products with impossible required groups", async () => {
		const group = (id: string, required: boolean, options: { id: string; priceDeltaCents: number }[]) => ({
			id,
			maxSelect: 1,
			name: id,
			options: options.map(option => ({
				description: "",
				imageUrl: null,
				maxPerItem: 1,
				name: option.id,
				popularity: 0,
				...option,
			})),
			priceRule: "sum",
			required,
			selectionType: "single",
			sortOrder: 0,
		});
		const prisma = prismaWith({ id: "u1", slug: "ipês" }, [
			{
				available: true,
				cashbackPercentOverride: null,
				categories: [],
				categoriesOverridden: true,
				excludedOptionIds: ["hidden"],
				featuredRank: null,
				id: "up-visible",
				priceCentsOverride: null,
				product: product("visible", {
					optionGroups: [
						group("g", true, [
							{ id: "shown", priceDeltaCents: 100 },
							{ id: "hidden", priceDeltaCents: 200 },
						]),
					],
				}),
				tags: [],
				tagsOverridden: true,
				unitId: "u1",
			},
			{
				available: true,
				cashbackPercentOverride: null,
				categories: [],
				categoriesOverridden: true,
				excludedOptionIds: ["only"],
				featuredRank: null,
				id: "up-hidden",
				priceCentsOverride: null,
				product: product("hidden", {
					optionGroups: [group("g2", true, [{ id: "only", priceDeltaCents: 100 }])],
				}),
				tags: [],
				tagsOverridden: true,
				unitId: "u1",
			},
		]);
		const items = (await new ListPublicMenu(prisma).execute("demo", "ipês")).flatMap(
			section => section.items,
		);
		expect(items.map(item => item.id)).toEqual(["up-visible"]);
		expect(items[0]?.optionGroups[0]?.options.map(option => option.id)).toEqual(["shown"]);
		expect(items[0]?.fromPriceCents).toBe(1100);
	});
});
