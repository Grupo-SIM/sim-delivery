import { CategoryErrors } from "@/modules/categories/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CategoryUnitsReturn } from "../dtos";

export class ListCategoryUnits {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, categoryId: string): Promise<CategoryUnitsReturn> {
		const category = companyId
			? await this.prisma.category.findFirst({ where: { companyId, id: categoryId } })
			: null;
		if (!category) {
			throw new DomainError(CategoryErrors.CATEGORY_NOT_FOUND);
		}

		const associations = await this.prisma.unitCategory.findMany({
			select: { unitId: true },
			where: { categoryId },
		});

		return associations.map(({ unitId }) => unitId);
	}
}
