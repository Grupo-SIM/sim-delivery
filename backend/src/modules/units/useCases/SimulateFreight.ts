import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { FreightSimulateBody, FreightSimulateReturn } from "../dtos";
import { UnitErrors } from "../errors";

export class SimulateFreight {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({ unitId, slug }: FreightSimulateBody): Promise<FreightSimulateReturn> {
		const company = await this.prisma.company.findUnique({ where: { slug } });
		if (!company) throw new DomainError(UnitErrors.NO_COMPANY);

		const unit = await this.prisma.unit.findFirst({
			select: { deliveryFee: true },
			where: { companyId: company.id, id: unitId },
		});
		if (!unit) throw new DomainError(UnitErrors.UNIT_NOT_FOUND);

		return { deliveryFee: unit.deliveryFee };
	}
}
