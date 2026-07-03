import { CategoryErrors } from "@/modules/categories/errors";
import { UnitErrors } from "@/modules/units/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { UnitProductReturn, UpdateUnitProductBody } from "../dtos";
import { UnitProductErrors } from "../errors";

export class UpdateUnitProduct {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		unitId: string,
		unitProductId: string,
		data: UpdateUnitProductBody,
	): Promise<UnitProductReturn> {
		const unit = companyId ? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } }) : null;
		if (!companyId || !unit) {
			throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		}

		const association = await this.prisma.unitProduct.findFirst({ where: { id: unitProductId, unitId } });
		if (!association) {
			throw new DomainError(UnitProductErrors.UNIT_PRODUCT_NOT_FOUND);
		}

		if (data.categoryId) {
			const category = await this.prisma.category.findFirst({ where: { companyId, id: data.categoryId } });
			if (!category) {
				throw new DomainError(CategoryErrors.CATEGORY_NOT_FOUND);
			}
		}

		return this.prisma.unitProduct.update({ data, where: { id: unitProductId } });
	}
}
