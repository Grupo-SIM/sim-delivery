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
				additionalOptions: true,
				categories: { include: { category: true } },
				optionOverrides: true,
				product: {
					include: {
						categories: { include: { category: true } },
						optionGroups: {
							include: {
								options: { orderBy: { sortOrder: "asc" } },
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

		const ratings = await this.prisma.productReview.groupBy({
			_avg: { rating: true },
			_count: { rating: true },
			by: ["productId"],
			where: { productId: { in: associations.map(association => association.product.id) } },
		});
		const ratingByProduct = new Map(ratings.map(r => [r.productId, r]));

		// Preserve category order (position asc) with the loose group last.
		const sections = new Map<string, PublicMenuSectionReturn>();
		const positionOf = new Map<string, number>();

		for (const association of associations) {
			const { product } = association;
			const excludedOptionIds = excludedByAssociation.get(association.id) ?? new Set<string>();
			const overridesByOptionId = new Map(
				(association.optionOverrides ?? []).map(override => [override.optionId, override]),
			);
			const optionGroups = product.optionGroups.map(group => ({
				...group,
				options: [
					...group.options.map(option => {
						const override = overridesByOptionId.get(option.id);
						return {
							...option,
							available: override?.available ?? option.available,
							description: override?.description ?? option.description,
							imageUrl: override?.imageUrl ?? option.imageUrl,
							maxPerItem: override?.maxPerItem ?? option.maxPerItem,
							name: override?.name ?? option.name,
							priceDeltaCents: override?.priceDeltaCents ?? option.priceDeltaCents,
							sortOrder: override?.sortOrder ?? option.sortOrder,
						};
					}),
					...(association.additionalOptions ?? [])
						.filter(option => option.groupId === group.id)
						.map(option => ({ ...option, popularity: 0 })),
				]
					.filter(option => option.available !== false && !excludedOptionIds.has(option.id))
					.sort((a, b) => a.sortOrder - b.sortOrder),
			}));
			const isOrderable = optionGroups.every(group => {
				if (!group.required) return true;
				const capacity = group.options.reduce(
					(sum, option) => sum + (option.maxPerItem ?? group.maxSelect),
					0,
				);
				return capacity >= 1;
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

				const regularPriceCents = association.priceCentsOverride ?? product.basePriceCents;
				const basePriceCents = association.promotionalPriceCents ?? regularPriceCents;
				const rating = ratingByProduct.get(product.id);

				// "A partir de": base + sum of cheapest available option per required group.
				const fromPriceCents =
					basePriceCents +
					optionGroups
						.filter(g => g.required && g.options.length > 0)
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
						required: g.required,
						selectionType: g.selectionType,
						sortOrder: g.sortOrder,
					})),
					popularity: product.popularity,
					priceCents: basePriceCents,
					productId: product.id,
					productSlug: product.slug,
					ratingAverage: rating?._avg.rating ?? null,
					ratingCount: rating?._count.rating ?? 0,
					regularPriceCents,
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
