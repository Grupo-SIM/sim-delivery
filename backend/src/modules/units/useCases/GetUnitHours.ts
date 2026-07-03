import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { UnitHoursListReturn } from "../dtos";
import { UnitErrors } from "../errors";

export class GetUnitHours {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, unitId: string): Promise<UnitHoursListReturn> {
		const unit = companyId ? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } }) : null;
		if (!unit) {
			throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		}

		return this.prisma.unitHours.findMany({ orderBy: { weekday: "asc" }, where: { unitId } });
	}
}
