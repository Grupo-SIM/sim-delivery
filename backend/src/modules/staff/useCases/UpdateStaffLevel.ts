import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { StaffReturn, UpdateStaffLevelDTO } from "../dtos";
import { StaffErrors } from "../errors";

export class UpdateStaffLevel {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({ companyId, level, staffId }: UpdateStaffLevelDTO): Promise<StaffReturn> {
		// Only an employee within the caller's own company may be changed.
		const target = await this.prisma.user.findFirst({ where: { companyId, id: staffId, role: "employee" } });
		if (!companyId || !target) {
			throw new DomainError(StaffErrors.STAFF_NOT_FOUND);
		}

		const staff = await this.prisma.user.update({
			data: { level },
			select: { createdAt: true, email: true, id: true, level: true, name: true, role: true },
			where: { id: staffId },
		});

		return staff as StaffReturn;
	}
}
