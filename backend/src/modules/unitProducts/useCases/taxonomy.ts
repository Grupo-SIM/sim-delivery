import { CategoryErrors } from "@/modules/categories/errors";
import { TagErrors } from "@/modules/tags/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { UnitProductReturn } from "../dtos";
import { UnitProductErrors } from "../errors";

export const unitProductTaxonomyInclude = { categories: true, excludedOptions: true, tags: true } as const;

type UnitProductTaxonomySource = Omit<UnitProductReturn, "categoryIds" | "excludedOptionIds" | "tagIds"> & {
	categories: { categoryId: string }[];
	excludedOptions: { optionId: string }[];
	tags: { tagId: string }[];
};

export function mapUnitProductTaxonomy(association: UnitProductTaxonomySource): UnitProductReturn {
	return {
		...association,
		categoryIds: association.categories.map(item => item.categoryId),
		excludedOptionIds: association.excludedOptions?.map(item => item.optionId) ?? [],
		tagIds: association.tags.map(item => item.tagId),
	};
}

export async function validateExcludedOptions(
	prisma: PrismaInstance,
	companyId: string,
	productId: string,
	optionIds: string[] | undefined,
): Promise<void> {
	if (!optionIds?.length) return;
	const count = await prisma.option.count({
		where: { group: { product: { companyId, id: productId } }, id: { in: optionIds } },
	});
	if (count !== optionIds.length) throw new DomainError(UnitProductErrors.INVALID_EXCLUDED_OPTION);
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
