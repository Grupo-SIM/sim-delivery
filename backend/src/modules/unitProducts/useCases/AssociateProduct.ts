import { ProductErrors } from "@/modules/products/errors";
import { UnitErrors } from "@/modules/units/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { AssociateProductBody, UnitProductReturn } from "../dtos";
import { UnitProductErrors } from "../errors";
import {
	mapUnitProductTaxonomy,
	unitProductTaxonomyInclude,
	validateExcludedOptions,
	validateUnitProductOptions,
	validateUnitTaxonomy,
} from "./taxonomy";

export class AssociateProduct {
	constructor(private readonly prisma: PrismaInstance) {}
	async execute(
		companyId: string | null,
		unitId: string,
		data: AssociateProductBody,
	): Promise<UnitProductReturn> {
		const unit = companyId ? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } }) : null;
		if (!companyId || !unit) throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		const { additionalOptions, productId, categoryIds, excludedOptionIds, optionOverrides, tagIds, ...overrides } = data;
		const product = await this.prisma.product.findFirst({ where: { companyId, id: productId } });
		if (!product) throw new DomainError(ProductErrors.PRODUCT_NOT_FOUND);
		await validateUnitTaxonomy(this.prisma, companyId, categoryIds, tagIds);
		await validateExcludedOptions(this.prisma, companyId, productId, excludedOptionIds);
		await validateUnitProductOptions(this.prisma, companyId, productId, optionOverrides, additionalOptions);
		const existing = await this.prisma.unitProduct.findUnique({
			where: { unitId_productId: { productId, unitId } },
		});
		if (existing) throw new DomainError(UnitProductErrors.UNIT_PRODUCT_EXISTS);
		const association = (await this.prisma.unitProduct.create({
			data: {
				...overrides,
				categories: { create: (categoryIds ?? []).map(categoryId => ({ categoryId })) },
				categoriesOverridden: categoryIds !== undefined && categoryIds !== null,
				productId,
				tags: { create: (tagIds ?? []).map(tagId => ({ tagId })) },
				tagsOverridden: tagIds !== undefined && tagIds !== null,
				unitId,
			},
			include: unitProductTaxonomyInclude,
		} as never)) as { id: string };
		if (excludedOptionIds?.length) {
			const exclusions = this.prisma as unknown as {
				unitProductExcludedOption: {
					createMany: (args: { data: { optionId: string; unitProductId: string }[] }) => Promise<unknown>;
				};
			};
			await exclusions.unitProductExcludedOption.createMany({
				data: excludedOptionIds.map(optionId => ({ optionId, unitProductId: association.id })),
			});
		}
		if (optionOverrides?.length || additionalOptions?.length) {
			const optionStore = this.prisma as unknown as {
				unitProductAdditionalOption: { createMany: (args: { data: object[] }) => Promise<unknown> };
				unitProductOptionOverride: { createMany: (args: { data: object[] }) => Promise<unknown> };
			};
			if (optionOverrides?.length) {
				await optionStore.unitProductOptionOverride.createMany({
					data: optionOverrides.map(({ optionId, ...override }) => ({ ...override, optionId, unitProductId: association.id })),
				});
			}
			if (additionalOptions?.length) {
				await optionStore.unitProductAdditionalOption.createMany({
					data: additionalOptions.map(option => ({
						available: option.available ?? true,
						description: option.description ?? "",
						groupId: option.groupId,
						imageUrl: option.imageUrl ?? null,
						maxPerItem: option.maxPerItem ?? null,
						name: option.name,
						priceDeltaCents: option.priceDeltaCents,
						sortOrder: option.sortOrder ?? 0,
						unitProductId: association.id,
					})),
				});
			}
		}
		const saved = (await this.prisma.unitProduct.findUnique({
			include: unitProductTaxonomyInclude,
			where: { id: association.id },
		})) as object | null;
		return mapUnitProductTaxonomy((saved ?? {
			...association,
			additionalOptions: [],
			categories: [],
			excludedOptions: [],
			optionOverrides: [],
			tags: [],
		}) as never);
	}
}
