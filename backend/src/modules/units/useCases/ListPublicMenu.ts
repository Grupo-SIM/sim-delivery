import type { PrismaInstance } from "@/shared/infra/sql";
import type { PublicMenuReturn, PublicMenuSectionReturn } from "../dtos";

/**
 * Builds a unit's storefront menu: available associations resolved to per-unit price/cashback,
 * grouped into sections by category (ordered by `position`), with the loose group (no category)
 * last. Public/no-auth; returns [] for a missing unit.
 */
export class ListPublicMenu {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(unitId: string): Promise<PublicMenuReturn> {
		const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
		if (!unit) {
			return [];
		}

		const associations = await this.prisma.unitProduct.findMany({
			include: {
				category: true,
				product: {
					include: {
						optionGroups: {
							include: {
								options: {
									orderBy: { sortOrder: "asc" },
									where: { available: true },
								},
							},
							orderBy: { sortOrder: "asc" },
						},
					},
				},
			},
			orderBy: { product: { title: "asc" } },
			where: { available: true, unitId },
		});

		// Preserve category order (position asc) with the loose group last.
		const sections = new Map<string, PublicMenuSectionReturn>();
		const positionOf = new Map<string, number>();

		for (const association of associations) {
			const { category, product } = association;
			const key = category?.id ?? "";

			let section = sections.get(key);
			if (!section) {
				section = { categoryId: category?.id ?? null, categoryName: category?.name ?? null, items: [] };
				sections.set(key, section);
				positionOf.set(key, category?.position ?? Number.POSITIVE_INFINITY);
			}

			const basePriceCents = association.priceCentsOverride ?? product.basePriceCents;

			// "A partir de": base + sum of cheapest available option per required group.
			const fromPriceCents =
				basePriceCents +
				product.optionGroups
					.filter(g => g.minSelect >= 1 && g.options.length > 0)
					.reduce((sum, g) => {
						const cheapest = Math.min(...g.options.map(o => o.priceDeltaCents));
						return sum + cheapest;
					}, 0);

			section.items.push({
				cashbackPercent: association.cashbackPercentOverride ?? product.cashbackPercentOverride,
				description: product.description,
				featuredRank: association.featuredRank,
				fromPriceCents,
				id: association.id,
				imageUrl: product.imageUrl,
				optionGroups: product.optionGroups.map(g => ({
					id: g.id,
					maxSelect: g.maxSelect,
					minSelect: g.minSelect,
					name: g.name,
					options: g.options.map(o => ({
						description: o.description,
						id: o.id,
						imageUrl: o.imageUrl,
						maxPerItem: o.maxPerItem,
						name: o.name,
						popularity: o.popularity,
						priceDeltaCents: o.priceDeltaCents,
					})),
					priceRule: g.priceRule,
					selectionType: g.selectionType,
					sortOrder: g.sortOrder,
				})),
				popularity: product.popularity,
				priceCents: basePriceCents,
				productId: product.id,
				title: product.title,
			});
		}

		return [...sections.entries()]
			.sort(([a], [b]) => (positionOf.get(a) ?? 0) - (positionOf.get(b) ?? 0))
			.map(([, section]) => section);
	}
}
