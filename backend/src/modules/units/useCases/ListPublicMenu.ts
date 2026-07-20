import type { PrismaInstance } from "@/shared/infra/sql";
import type { PublicMenuReturn, PublicMenuSectionReturn } from "../dtos";

/**
 * Builds a unit's storefront menu: available associations resolved to per-unit price/cashback,
 * grouped into sections by category (ordered by `position`), with the loose group (no category)
 * last. Public/no-auth; returns [] for a missing unit.
 */
export class ListPublicMenu {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companySlug: string | undefined, unitSlug: string): Promise<PublicMenuReturn> {
		if (!companySlug) {
			return [];
		}

		const company = await this.prisma.company.findUnique({ where: { slug: companySlug } });
		const unit = company
			? await this.prisma.unit.findUnique({
					where: { companyId_slug: { companyId: company.id, slug: unitSlug } },
				})
			: null;
		if (!unit) {
			return [];
		}

		const associations = await this.prisma.unitProduct.findMany({
			include: {
				categories: { include: { category: true } },
				product: {
					include: {
						categories: { include: { category: true } },
						optionGroups: {
							include: {
								options: {
									orderBy: { sortOrder: "asc" },
									where: { available: true },
								},
							},
							orderBy: { sortOrder: "asc" },
						},
						tags: { include: { tag: true } },
					},
				},
				tags: { include: { tag: true } },
			},
			orderBy: { product: { title: "asc" } },
			where: { available: true, unitId: unit.id },
		});
		const exclusions = this.prisma as unknown as {
			unitProductExcludedOption: {
				findMany: (args: {
					where: { unitProductId: { in: string[] } };
				}) => Promise<{ optionId: string; unitProductId: string }[]>;
			};
		};
		const excludedByAssociation = new Map<string, Set<string>>();
		for (const exclusion of await exclusions.unitProductExcludedOption.findMany({
			where: { unitProductId: { in: associations.map(association => association.id) } },
		})) {
			const ids = excludedByAssociation.get(exclusion.unitProductId) ?? new Set<string>();
			ids.add(exclusion.optionId);
			excludedByAssociation.set(exclusion.unitProductId, ids);
		}

		// Preserve category order (position asc) with the loose group last.
		const sections = new Map<string, PublicMenuSectionReturn>();
		const positionOf = new Map<string, number>();

		for (const association of associations) {
			const { product } = association;
			const excludedOptionIds = excludedByAssociation.get(association.id) ?? new Set<string>();
			const optionGroups = product.optionGroups.map(group => ({
				...group,
				options: group.options.filter(option => !excludedOptionIds.has(option.id)),
			}));
			const isOrderable = optionGroups.every(group => {
				if (group.minSelect < 1) return true;
				const capacity = group.options.reduce(
					(sum, option) => sum + (option.maxPerItem ?? group.maxSelect),
					0,
				);
				return capacity >= group.minSelect;
			});
			if (!isOrderable) continue;
			const categories = association.categoriesOverridden
				? association.categories.map(item => item.category)
				: product.categories.map(item => item.category);
			const tags = (
				association.tagsOverridden
					? association.tags.map(item => item.tag)
					: product.tags.map(item => item.tag)
			).map(({ color, id, name }) => ({ color, id, name }));
			const effectiveCategories = categories.length > 0 ? categories : [null];
			for (const category of effectiveCategories) {
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
					optionGroups
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
					optionGroups: optionGroups.map(g => ({
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
					productSlug: product.slug,
					tags,
					title: product.title,
				});
			}
		}

		return [...sections.entries()]
			.sort(([a], [b]) => (positionOf.get(a) ?? 0) - (positionOf.get(b) ?? 0))
			.map(([, section]) => section);
	}
}
