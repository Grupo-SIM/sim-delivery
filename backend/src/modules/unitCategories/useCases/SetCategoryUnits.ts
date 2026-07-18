import { CategoryErrors } from "@/modules/categories/errors";
import { UnitErrors } from "@/modules/units/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CategoryUnitsReturn } from "../dtos";

export class SetCategoryUnits {
	constructor(private readonly prisma: PrismaInstance) {}

	/** Replaces the whole set of units a category is assigned to. Newly linked units get the
	 * category appended to the end of their order; units that stay linked keep their position. */
	async execute(
		companyId: string | null,
		categoryId: string,
		unitIds: string[],
	): Promise<CategoryUnitsReturn> {
		const category = companyId
			? await this.prisma.category.findFirst({ where: { companyId, id: categoryId } })
			: null;
		if (!category) {
			throw new DomainError(CategoryErrors.CATEGORY_NOT_FOUND);
		}

		const uniqueUnitIds = [...new Set(unitIds)];
		if (uniqueUnitIds.length > 0) {
			const unitsCount = await this.prisma.unit.count({
				where: { ...(companyId ? { companyId } : {}), id: { in: uniqueUnitIds } },
			});
			if (unitsCount !== uniqueUnitIds.length) {
				throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
			}
		}

		const existing = await this.prisma.unitCategory.findMany({
			select: { unitId: true },
			where: { categoryId },
		});
		const existingUnitIds = existing.map(({ unitId }) => unitId);

		const toAdd = uniqueUnitIds.filter(unitId => !existingUnitIds.includes(unitId));
		const toRemove = existingUnitIds.filter(unitId => !uniqueUnitIds.includes(unitId));

		const positions = await Promise.all(
			toAdd.map(unitId => this.prisma.unitCategory.count({ where: { unitId } })),
		);

		await this.prisma.$transaction([
			this.prisma.unitCategory.deleteMany({ where: { categoryId, unitId: { in: toRemove } } }),
			this.prisma.unitCategory.createMany({
				data: toAdd.map((unitId, index) => ({ categoryId, position: positions[index], unitId })),
			}),
		]);

		return uniqueUnitIds;
	}
}
