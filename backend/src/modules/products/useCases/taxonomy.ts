import { CategoryErrors } from "@/modules/categories/errors";
import { TagErrors } from "@/modules/tags/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { ProductReturn } from "../dtos";

export const productTaxonomyInclude = {
	categories: { include: { category: true } },
	tags: { include: { tag: true } },
} as const;

type ProductTaxonomySource = Omit<ProductReturn, "categories" | "tags"> & {
	categories?: { category: ProductReturn["categories"][number] }[];
	tags?: { tag: ProductReturn["tags"][number] }[];
};

export function mapProductTaxonomy(product: ProductTaxonomySource): ProductReturn {
	return {
		...product,
		categories: Array.isArray(product.categories) ? product.categories.map(item => item.category) : [],
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
