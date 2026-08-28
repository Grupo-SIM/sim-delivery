import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { StaffReturn, UpdateStaffUnitsDTO } from "../dtos";
import { StaffErrors } from "../errors";

export class UpdateStaffUnits {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({ companyId, staffId, unitIds }: UpdateStaffUnitsDTO): Promise<StaffReturn> {
		if (!companyId) throw new DomainError(StaffErrors.NO_COMPANY);

		const staff = await this.prisma.user.findFirst({
			select: { createdAt: true, email: true, id: true, name: true, role: true },
			where: { companyId, id: staffId, role: { in: ["manager", "attendant", "kitchen", "courier"] } },
		});
		if (!staff) throw new DomainError(StaffErrors.STAFF_NOT_FOUND);

		const uniqueUnitIds = [...new Set(unitIds)];
		const units = await this.prisma.unit.findMany({
			select: { id: true },
			where: { companyId, id: { in: uniqueUnitIds } },
		});
		if (units.length !== uniqueUnitIds.length) throw new DomainError(StaffErrors.UNIT_NOT_FOUND);

		await this.prisma.$transaction([
			this.prisma.staffUnit.deleteMany({ where: { userId: staffId } }),
			this.prisma.staffUnit.createMany({
				data: uniqueUnitIds.map(unitId => ({ unitId, userId: staffId })),
			}),
		]);

		return { ...staff, unitIds: uniqueUnitIds } as StaffReturn;
	}
}
