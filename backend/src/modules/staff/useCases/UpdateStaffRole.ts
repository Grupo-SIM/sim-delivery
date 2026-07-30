import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { StaffReturn, UpdateStaffRoleDTO } from "../dtos";
import { StaffErrors } from "../errors";

export class UpdateStaffRole {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({ companyId, role, staffId }: UpdateStaffRoleDTO): Promise<StaffReturn> {
		// Only a manager/attendant/kitchen/courier staff member in caller's company may be changed.
		const target = await this.prisma.user.findFirst({
			where: { companyId, id: staffId, role: { in: ["manager", "attendant", "kitchen", "courier"] } },
		});
		if (!companyId || !target) {
			throw new DomainError(StaffErrors.STAFF_NOT_FOUND);
		}

		const staff = await this.prisma.user.update({
			data: { role },
			select: { createdAt: true, email: true, id: true, name: true, role: true },
			where: { id: staffId },
		});
		await this.prisma.staffUnit.deleteMany({ where: { userId: staffId } });

		return { ...staff, unitIds: [] } as StaffReturn;
	}
}
