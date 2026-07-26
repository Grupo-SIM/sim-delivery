import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { StaffErrors } from "../errors";

export class RemoveStaff {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, staffId: string, isSuperAdmin = false): Promise<void> {
		// Only a manager/attendant/kitchen/courier staff member may be removed (never owner).
		const target = await this.prisma.user.findFirst({
			where: {
				...(isSuperAdmin ? {} : { companyId }),
				id: staffId,
				role: { in: ["manager", "attendant", "kitchen", "courier"] },
			},
		});
		if (!target || (!isSuperAdmin && !companyId)) {
			throw new DomainError(StaffErrors.STAFF_NOT_FOUND);
		}

		await this.prisma.user.delete({ where: { id: staffId } });
	}
}
