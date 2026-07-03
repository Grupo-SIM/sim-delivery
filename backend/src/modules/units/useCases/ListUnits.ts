import type { PrismaInstance } from "@/shared/infra/sql";
import type { UnitWithStatusListReturn } from "../dtos";
import { isUnitOpen } from "../isUnitOpen";

export class ListUnits {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<UnitWithStatusListReturn> {
		if (!companyId) {
			return [];
		}

		const units = await this.prisma.unit.findMany({
			include: { hours: true },
			orderBy: { createdAt: "asc" },
			where: { companyId },
		});

		return units.map(({ hours, ...unit }) => ({ ...unit, isOpenNow: isUnitOpen(hours, unit.isOpenManual) }));
	}
}
