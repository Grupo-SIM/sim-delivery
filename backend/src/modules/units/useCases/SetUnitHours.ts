import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { SetUnitHoursBody, UnitHoursListReturn } from "../dtos";
import { UnitErrors } from "../errors";

export class SetUnitHours {
	constructor(private readonly prisma: PrismaInstance) {}

	/** Replaces the unit's weekly schedule, upserting one row per provided weekday. */
	async execute(companyId: string | null, unitId: string, days: SetUnitHoursBody["hours"]): Promise<UnitHoursListReturn> {
		const unit = companyId ? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } }) : null;
		if (!unit) {
			throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		}

		await Promise.all(
			days.map(day =>
				this.prisma.unitHours.upsert({
					create: { ...day, unitId },
					update: { closed: day.closed, closesAt: day.closesAt, opensAt: day.opensAt },
					where: { unitId_weekday: { unitId, weekday: day.weekday } },
				}),
			),
		);

		return this.prisma.unitHours.findMany({ orderBy: { weekday: "asc" }, where: { unitId } });
	}
}
