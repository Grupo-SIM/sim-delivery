import { UnitErrors } from "@/modules/units/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { UnitCategoriesReturn } from "../dtos";

export class ListUnitCategories {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, unitId: string): Promise<UnitCategoriesReturn> {
		const unit = companyId ? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } }) : null;
		if (!unit) {
			throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		}

		const associations = await this.prisma.unitCategory.findMany({
			include: { category: true },
			orderBy: { position: "asc" },
			where: { unitId },
		});

		return associations.map(({ category, position }) => ({
			id: category.id,
			imageUrl: category.imageUrl,
			name: category.name,
			position,
		}));
	}
}
