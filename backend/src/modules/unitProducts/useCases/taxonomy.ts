import { CategoryErrors } from "@/modules/categories/errors";
import { TagErrors } from "@/modules/tags/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { UnitProductReturn } from "../dtos";

export const unitProductTaxonomyInclude = { categories: true, tags: true } as const;

type UnitProductTaxonomySource = Omit<UnitProductReturn, "categoryIds" | "tagIds"> & {
	categories: { categoryId: string }[];
	tags: { tagId: string }[];
};

export function mapUnitProductTaxonomy(association: UnitProductTaxonomySource): UnitProductReturn {
	return {
		...association,
		categoryIds: association.categories.map(item => item.categoryId),
		tagIds: association.tags.map(item => item.tagId),
	};
}

export async function validateUnitTaxonomy(
	prisma: PrismaInstance,
	companyId: string,
	categoryIds?: string[] | null,
	tagIds?: string[] | null,
) {
	if (categoryIds) {
		const count = await prisma.category.count({ where: { companyId, id: { in: categoryIds } } });
		if (count !== categoryIds.length) throw new DomainError(CategoryErrors.CATEGORY_NOT_FOUND);
	}
	if (tagIds) {
		const count = await prisma.tag.count({ where: { companyId, id: { in: tagIds } } });
		if (count !== tagIds.length) throw new DomainError(TagErrors.TAG_NOT_FOUND);
	}
}
