import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { haversineKm } from "@/shared/utils/geo";
import type { FreightSimulateBody, FreightSimulateReturn } from "../dtos";
import { UnitErrors } from "../errors";

export class SimulateFreight {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({ unitId, slug, latitude, longitude }: FreightSimulateBody): Promise<FreightSimulateReturn> {
		const company = await this.prisma.company.findUnique({ where: { slug } });
		if (!company) throw new DomainError(UnitErrors.NO_COMPANY);

		const unit = await this.prisma.unit.findFirst({
			select: {
				deliveryFee: true,
				deliveryFeeFallbackEnabled: true,
				deliveryZones: { orderBy: { radiusKm: "asc" } },
				latitude: true,
				longitude: true,
			},
			where: { companyId: company.id, id: unitId },
		});
		if (!unit) throw new DomainError(UnitErrors.UNIT_NOT_FOUND);

		const distanceKm =
			unit.latitude !== null && unit.longitude !== null
				? haversineKm({ latitude: unit.latitude, longitude: unit.longitude }, { latitude, longitude })
				: null;

		const zone = distanceKm !== null ? unit.deliveryZones.find(z => distanceKm <= z.radiusKm) : undefined;

		if (zone) {
			return {
				deliveryFee: zone.fee,
				distanceKm: distanceKm ?? undefined,
				etaMaxMinutes: zone.etaMaxMinutes ?? undefined,
				etaMinMinutes: zone.etaMinMinutes ?? undefined,
			};
		}

		if (!unit.deliveryFeeFallbackEnabled) {
			throw new DomainError(UnitErrors.OUT_OF_DELIVERY_RANGE);
		}

		return { deliveryFee: unit.deliveryFee, distanceKm: distanceKm ?? undefined };
	}
}
