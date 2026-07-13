import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { DeliveryZoneListReturn } from "../dtos";
import { UnitErrors } from "../errors";

export class ListDeliveryZones {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, unitId: string): Promise<DeliveryZoneListReturn> {
		const unit = companyId ? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } }) : null;
		if (!unit) {
			throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		}

		return this.prisma.deliveryZone.findMany({ orderBy: { radiusKm: "asc" }, where: { unitId } });
	}
}
