import type { PrismaInstance } from "@/shared/infra/sql";
import type { Role } from "@/shared/permissions";
import type { UnitWithStatusListReturn } from "../dtos";
import { isUnitOpen } from "../isUnitOpen";

export class ListUnits {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, role?: Role, userId?: string): Promise<UnitWithStatusListReturn> {
		const staffUnitScope =
			(role === "courier" || role === "kitchen") && userId ? { staffUnits: { some: { userId } } } : {};
		const units = await this.prisma.unit.findMany({
			include: { hours: true },
			orderBy: { createdAt: "asc" },
			where: { ...(companyId ? { companyId } : {}), ...staffUnitScope },
		});

		return units.map(({ hours, ...unit }) => ({ ...unit, isOpenNow: isUnitOpen(hours, unit.isOpenManual) }));
	}
}
