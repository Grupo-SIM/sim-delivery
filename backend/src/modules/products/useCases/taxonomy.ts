import { CategoryErrors } from "@/modules/categories/errors";
import { TagErrors } from "@/modules/tags/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { ProductReturn } from "../dtos";

export const productTaxonomyInclude = {
	_count: { select: { optionGroups: true } },
	categories: { include: { category: true } },
	optionGroups: {
		orderBy: { sortOrder: "asc" },
		select: { _count: { select: { options: true } }, id: true, name: true },
	},
	tags: { include: { tag: true } },
} as const;

type ProductTaxonomySource = Omit<
	ProductReturn,
	"categories" | "optionGroupCount" | "optionGroups" | "tags"
> & {
	_count?: { optionGroups: number };
	categories?: { category: ProductReturn["categories"][number] }[];
	optionGroups?: { _count: { options: number }; id: string; name: string }[];
	tags?: { tag: ProductReturn["tags"][number] }[];
};

export function mapProductTaxonomy(product: ProductTaxonomySource): ProductReturn {
	const { _count, ...rest } = product;
	return {
		...rest,
		categories: Array.isArray(product.categories) ? product.categories.map(item => item.category) : [],
		optionGroupCount: _count?.optionGroups ?? 0,
		optionGroups: Array.isArray(product.optionGroups)
			? product.optionGroups.map(group => ({
					id: group.id,
					name: group.name,
					optionCount: group._count.options,
				}))
			: [],
		tags: Array.isArray(product.tags) ? product.tags.map(item => item.tag) : [],
	};
}

export async function validateTaxonomy(
	prisma: PrismaInstance,
	companyId: string,
	categoryIds?: string[],
	tagIds?: string[],
): Promise<void> {
	if (categoryIds) {
		const count = await prisma.category.count({ where: { companyId, id: { in: categoryIds } } });
		if (count !== categoryIds.length) throw new DomainError(CategoryErrors.CATEGORY_NOT_FOUND);
	}
	if (tagIds) {
		const count = await prisma.tag.count({ where: { companyId, id: { in: tagIds } } });
		if (count !== tagIds.length) throw new DomainError(TagErrors.TAG_NOT_FOUND);
	}
}
