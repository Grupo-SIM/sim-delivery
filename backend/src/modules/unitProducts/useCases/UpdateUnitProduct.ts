import { UnitErrors } from "@/modules/units/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { UnitProductReturn, UpdateUnitProductBody } from "../dtos";
import { UnitProductErrors } from "../errors";
import {
	mapUnitProductTaxonomy,
	unitProductTaxonomyInclude,
	validateExcludedOptions,
	validateUnitProductOptions,
	validateUnitTaxonomy,
} from "./taxonomy";

export class UpdateUnitProduct {
	constructor(private readonly prisma: PrismaInstance) {}
	async execute(
		companyId: string | null,
		unitId: string,
		unitProductId: string,
		data: UpdateUnitProductBody,
	): Promise<UnitProductReturn> {
		const unit = companyId ? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } }) : null;
		if (!companyId || !unit) throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		const existing = await this.prisma.unitProduct.findFirst({ where: { id: unitProductId, unitId } });
		if (!existing) throw new DomainError(UnitProductErrors.UNIT_PRODUCT_NOT_FOUND);
		const { additionalOptions, categoryIds, excludedOptionIds, optionOverrides, tagIds, ...fields } = data;
		await validateUnitTaxonomy(this.prisma, companyId, categoryIds, tagIds);
		await validateExcludedOptions(this.prisma, companyId, existing.productId, excludedOptionIds);
		await validateUnitProductOptions(this.prisma, companyId, existing.productId, optionOverrides, additionalOptions);
		await this.prisma.unitProduct.update({
			data: {
				...fields,
				...(categoryIds !== undefined && {
					categories: { create: (categoryIds ?? []).map(categoryId => ({ categoryId })), deleteMany: {} },
					categoriesOverridden: categoryIds !== null,
				}),
				...(tagIds !== undefined && {
					tags: { create: (tagIds ?? []).map(tagId => ({ tagId })), deleteMany: {} },
					tagsOverridden: tagIds !== null,
				}),
			},
			include: unitProductTaxonomyInclude,
			where: { id: unitProductId },
		} as never);
		if (excludedOptionIds !== undefined) {
			const exclusions = this.prisma as unknown as {
				unitProductExcludedOption: {
					createMany: (args: { data: { optionId: string; unitProductId: string }[] }) => Promise<unknown>;
					deleteMany: (args: { where: { unitProductId: string } }) => Promise<unknown>;
				};
			};
			await exclusions.unitProductExcludedOption.deleteMany({ where: { unitProductId } });
			if (excludedOptionIds.length > 0) {
				await exclusions.unitProductExcludedOption.createMany({
					data: excludedOptionIds.map(optionId => ({ optionId, unitProductId })),
				});
			}
		}
		if (optionOverrides !== undefined || additionalOptions !== undefined) {
			const optionStore = this.prisma as unknown as {
				unitProductAdditionalOption: {
					createMany: (args: { data: object[] }) => Promise<unknown>;
					deleteMany: (args: { where: { unitProductId: string } }) => Promise<unknown>;
				};
				unitProductOptionOverride: {
					createMany: (args: { data: object[] }) => Promise<unknown>;
					deleteMany: (args: { where: { unitProductId: string } }) => Promise<unknown>;
				};
			};
			if (optionOverrides !== undefined) {
				await optionStore.unitProductOptionOverride.deleteMany({ where: { unitProductId } });
				if (optionOverrides.length > 0) {
					await optionStore.unitProductOptionOverride.createMany({
						data: optionOverrides.map(({ optionId, ...override }) => ({ ...override, optionId, unitProductId })),
					});
				}
			}
			if (additionalOptions !== undefined) {
				await optionStore.unitProductAdditionalOption.deleteMany({ where: { unitProductId } });
				if (additionalOptions.length > 0) {
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
							unitProductId,
						})),
					});
				}
			}
		}
		const saved = await this.prisma.unitProduct.findUnique({
			include: unitProductTaxonomyInclude,
			where: { id: unitProductId },
		});
		return mapUnitProductTaxonomy((saved ?? {
			additionalOptions: [],
			categories: [],
			excludedOptions: [],
			id: unitProductId,
			optionOverrides: [],
			tags: [],
		}) as never);
	}
}
