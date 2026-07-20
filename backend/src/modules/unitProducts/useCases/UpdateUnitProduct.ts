import { UnitErrors } from "@/modules/units/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { UnitProductReturn, UpdateUnitProductBody } from "../dtos";
import { UnitProductErrors } from "../errors";
import {
	mapUnitProductTaxonomy,
	unitProductTaxonomyInclude,
	validateExcludedOptions,
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
		const { categoryIds, excludedOptionIds, tagIds, ...fields } = data;
		await validateUnitTaxonomy(this.prisma, companyId, categoryIds, tagIds);
		await validateExcludedOptions(this.prisma, companyId, existing.productId, excludedOptionIds);
		const association = (await this.prisma.unitProduct.update({
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
		} as never)) as object;
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
		return mapUnitProductTaxonomy({
			...association,
			categories: [],
			excludedOptions: excludedOptionIds?.map(optionId => ({ optionId })) ?? [],
			tags: [],
		} as never);
	}
}
