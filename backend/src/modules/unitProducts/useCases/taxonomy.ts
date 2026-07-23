import { CategoryErrors } from "@/modules/categories/errors";
import { TagErrors } from "@/modules/tags/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { AdditionalOptionInput, OptionOverrideInput, UnitProductReturn } from "../dtos";
import { UnitProductErrors } from "../errors";

export const unitProductTaxonomyInclude = {
	additionalOptions: true,
	categories: true,
	excludedOptions: true,
	optionOverrides: true,
	tags: true,
} as const;


type UnitProductTaxonomySource = Omit<
	UnitProductReturn,
	"additionalOptions" | "categoryIds" | "excludedOptionIds" | "optionOverrides" | "tagIds"
> & {
	additionalOptions?: {
		available: boolean;
		description: string;
		groupId: string;
		id: string;
		imageUrl: string | null;
		maxPerItem: number | null;
		name: string;
		priceDeltaCents: number;
		sortOrder: number;
	}[];
	categories: { categoryId: string }[];
	excludedOptions: { optionId: string }[];
	optionOverrides?: {
		available: boolean | null;
		description: string | null;
		imageUrl: string | null;
		maxPerItem: number | null;
		name: string | null;
		optionId: string;
		priceDeltaCents: number | null;
		sortOrder: number | null;
	}[];
	tags: { tagId: string }[];
};

export function mapUnitProductTaxonomy(association: UnitProductTaxonomySource): UnitProductReturn {
	if (!association) {
		return {
			additionalOptions: [],
			categoryIds: [],
			excludedOptionIds: [],
			optionOverrides: [],
			tagIds: [],
		} as unknown as UnitProductReturn;
	}
	return {
		...association,
		additionalOptions: association.additionalOptions ?? [],
		categoryIds: association.categories.map(item => item.categoryId),
		excludedOptionIds: association.excludedOptions?.map(item => item.optionId) ?? [],
		optionOverrides: association.optionOverrides ?? [],
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

export async function validateUnitProductOptions(
	prisma: PrismaInstance,
	companyId: string,
	productId: string,
	optionOverrides: OptionOverrideInput[] | undefined,
	additionalOptions: AdditionalOptionInput[] | undefined,
): Promise<void> {
	const optionIds = optionOverrides?.map(option => option.optionId) ?? [];
	const groupIds = additionalOptions?.map(option => option.groupId) ?? [];
	if (new Set(optionIds).size !== optionIds.length || new Set(groupIds).size !== groupIds.length) {
		throw new DomainError(UnitProductErrors.INVALID_EXCLUDED_OPTION);
	}
	if (optionIds.length > 0) {
		const count = await prisma.option.count({
			where: { group: { product: { companyId, id: productId } }, id: { in: optionIds } },
		});
		if (count !== optionIds.length) throw new DomainError(UnitProductErrors.INVALID_EXCLUDED_OPTION);
	}
	if (groupIds.length > 0) {
		const count = await prisma.optionGroup.count({ where: { product: { companyId, id: productId }, id: { in: groupIds } } });
		if (count !== groupIds.length) throw new DomainError(UnitProductErrors.INVALID_EXCLUDED_OPTION);
	}
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
