import { CategoryErrors } from "@/modules/categories/errors";
import { UnitErrors } from "@/modules/units/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type {
	UpdateUnitProductsAvailabilityBody,
	UpdateUnitProductsAvailabilityReturn,
} from "../dtos";

export class UpdateUnitProductsAvailability {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		unitId: string,
		data: UpdateUnitProductsAvailabilityBody,
	): Promise<UpdateUnitProductsAvailabilityReturn> {
		const unit = companyId
			? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } })
			: null;
		if (!companyId || !unit) throw new DomainError(UnitErrors.UNIT_NOT_FOUND);

		if (data.categoryId) {
			const category = await this.prisma.category.findFirst({
				where: { companyId, id: data.categoryId },
			});
			if (!category) throw new DomainError(CategoryErrors.CATEGORY_NOT_FOUND);
		}

		const result = await this.prisma.unitProduct.updateMany({
			data: { available: data.available },
			where: {
				unitId,
				...(data.categoryId && {
					OR: [
						{
							categories: { some: { categoryId: data.categoryId } },
							categoriesOverridden: true,
						},
						{
							categoriesOverridden: false,
							product: { categories: { some: { categoryId: data.categoryId } } },
						},
					],
				}),
			},
		});

		return { updatedCount: result.count };
	}
}
