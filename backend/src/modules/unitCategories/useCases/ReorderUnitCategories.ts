import { UnitErrors } from "@/modules/units/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { UnitCategoriesReturn } from "../dtos";
import { UnitCategoryErrors } from "../errors";

export class ReorderUnitCategories {
	constructor(private readonly prisma: PrismaInstance) {}

	/** Persists a drag-and-drop reorder: `categoryIds` is the full new order for this unit. */
	async execute(
		companyId: string | null,
		unitId: string,
		categoryIds: string[],
	): Promise<UnitCategoriesReturn> {
		const unit = companyId ? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } }) : null;
		if (!unit) {
			throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		}

		const existing = await this.prisma.unitCategory.findMany({
			include: { category: true },
			where: { unitId },
		});
		const existingByCategoryId = new Map(existing.map(row => [row.categoryId, row]));

		if (
			categoryIds.length !== existing.length ||
			!categoryIds.every(categoryId => existingByCategoryId.has(categoryId))
		) {
			throw new DomainError(UnitCategoryErrors.UNIT_CATEGORY_NOT_LINKED);
		}

		await this.prisma.$transaction(
			categoryIds.map((categoryId, position) => {
				const row = existingByCategoryId.get(categoryId);
				if (!row) throw new DomainError(UnitCategoryErrors.UNIT_CATEGORY_NOT_LINKED);
				return this.prisma.unitCategory.update({ data: { position }, where: { id: row.id } });
			}),
		);

		return categoryIds.map((categoryId, position) => {
			const row = existingByCategoryId.get(categoryId);
			return {
				id: categoryId,
				imageUrl: row?.category.imageUrl ?? "",
				name: row?.category.name ?? "",
				position,
			};
		});
	}
}
