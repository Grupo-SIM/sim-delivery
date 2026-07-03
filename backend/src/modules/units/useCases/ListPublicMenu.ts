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
			include: { category: true, product: true },
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

			section.items.push({
				cashbackPercent: association.cashbackPercentOverride ?? product.cashbackPercentOverride,
				description: product.description,
				id: association.id,
				imageUrl: product.imageUrl,
				priceCents: association.priceCentsOverride ?? product.basePriceCents,
				productId: product.id,
				title: product.title,
			});
		}

		return [...sections.entries()]
			.sort(([a], [b]) => (positionOf.get(a) ?? 0) - (positionOf.get(b) ?? 0))
			.map(([, section]) => section);
	}
}
