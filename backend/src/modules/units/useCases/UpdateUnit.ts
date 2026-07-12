import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { UnitReturn, UpdateUnitBody } from "../dtos";
import { UnitErrors } from "../errors";

export class UpdateUnit {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, unitId: string, data: UpdateUnitBody): Promise<UnitReturn> {
		const unit = await this.prisma.unit.findFirst({
			where: { ...(companyId ? { companyId } : {}), id: unitId },
		});
		if (!unit) {
			throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		}

		return this.prisma.unit.update({ data, where: { id: unitId } });
	}
}
