import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { DeliveryZoneListReturn, SetDeliveryZonesBody } from "../dtos";
import { UnitErrors } from "../errors";

export class SetDeliveryZones {
	constructor(private readonly prisma: PrismaInstance) {}

	/** Replaces the unit's whole set of delivery zones (radius bands). */
	async execute(
		companyId: string | null,
		unitId: string,
		zones: SetDeliveryZonesBody["zones"],
	): Promise<DeliveryZoneListReturn> {
		const unit = companyId ? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } }) : null;
		if (!unit) {
			throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		}

		const radii = zones.map(zone => zone.radiusKm);
		if (new Set(radii).size !== radii.length) {
			throw new DomainError(UnitErrors.DUPLICATE_ZONE_RADIUS);
		}

		await this.prisma.$transaction([
			this.prisma.deliveryZone.deleteMany({ where: { unitId } }),
			this.prisma.deliveryZone.createMany({ data: zones.map(zone => ({ ...zone, unitId })) }),
		]);

		return this.prisma.deliveryZone.findMany({ orderBy: { radiusKm: "asc" }, where: { unitId } });
	}
}
