import { ProductErrors } from "@/modules/products/errors";
import { UnitErrors } from "@/modules/units/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { AssociateProductBody, UnitProductReturn } from "../dtos";
import { UnitProductErrors } from "../errors";
import { mapUnitProductTaxonomy, unitProductTaxonomyInclude, validateUnitTaxonomy } from "./taxonomy";

export class AssociateProduct {
	constructor(private readonly prisma: PrismaInstance) {}
	async execute(
		companyId: string | null,
		unitId: string,
		data: AssociateProductBody,
	): Promise<UnitProductReturn> {
		const unit = companyId ? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } }) : null;
		if (!companyId || !unit) throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		const { productId, categoryIds, tagIds, ...overrides } = data;
		const product = await this.prisma.product.findFirst({ where: { companyId, id: productId } });
		if (!product) throw new DomainError(ProductErrors.PRODUCT_NOT_FOUND);
		await validateUnitTaxonomy(this.prisma, companyId, categoryIds, tagIds);
		const existing = await this.prisma.unitProduct.findUnique({
			where: { unitId_productId: { productId, unitId } },
		});
		if (existing) throw new DomainError(UnitProductErrors.UNIT_PRODUCT_EXISTS);
		const association = await this.prisma.unitProduct.create({
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
		});
		return mapUnitProductTaxonomy(association);
	}
}
