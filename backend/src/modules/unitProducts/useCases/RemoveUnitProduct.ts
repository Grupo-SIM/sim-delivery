import { UnitErrors } from "@/modules/units/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { UnitProductErrors } from "../errors";

export class RemoveUnitProduct {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, unitId: string, unitProductId: string): Promise<void> {
		const unit = companyId ? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } }) : null;
		if (!unit) {
			throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		}

		const association = await this.prisma.unitProduct.findFirst({ where: { id: unitProductId, unitId } });
		if (!association) {
			throw new DomainError(UnitProductErrors.UNIT_PRODUCT_NOT_FOUND);
		}

		await this.prisma.unitProduct.delete({ where: { id: unitProductId } });
	}
}
