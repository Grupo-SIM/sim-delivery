import { UnitErrors } from "@/modules/units/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { UnitProductListReturn } from "../dtos";
import { mapUnitProductTaxonomy, unitProductTaxonomyInclude } from "./taxonomy";

export class ListUnitProducts {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, unitId: string): Promise<UnitProductListReturn> {
		const unit = companyId ? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } }) : null;
		if (!unit) {
			throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		}

		const associations = await this.prisma.unitProduct.findMany({
			include: unitProductTaxonomyInclude,
			orderBy: [{ createdAt: "asc" }],
			where: { unitId },
		});
		return associations.map(mapUnitProductTaxonomy);
	}
}
