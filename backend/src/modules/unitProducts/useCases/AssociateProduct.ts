import { CategoryErrors } from "@/modules/categories/errors";
import { ProductErrors } from "@/modules/products/errors";
import { UnitErrors } from "@/modules/units/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { AssociateProductBody, UnitProductReturn } from "../dtos";
import { UnitProductErrors } from "../errors";

export class AssociateProduct {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		unitId: string,
		{ productId, categoryId, ...overrides }: AssociateProductBody,
	): Promise<UnitProductReturn> {
		const unit = companyId ? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } }) : null;
		if (!companyId || !unit) {
			throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		}

		const product = await this.prisma.product.findFirst({ where: { companyId, id: productId } });
		if (!product) {
			throw new DomainError(ProductErrors.PRODUCT_NOT_FOUND);
		}

		if (categoryId) {
			const category = await this.prisma.category.findFirst({ where: { companyId, id: categoryId } });
			if (!category) {
				throw new DomainError(CategoryErrors.CATEGORY_NOT_FOUND);
			}
		}

		const existing = await this.prisma.unitProduct.findUnique({
			where: { unitId_productId: { productId, unitId } },
		});
		if (existing) {
			throw new DomainError(UnitProductErrors.UNIT_PRODUCT_EXISTS);
		}

		return this.prisma.unitProduct.create({ data: { ...overrides, categoryId, productId, unitId } });
	}
}
