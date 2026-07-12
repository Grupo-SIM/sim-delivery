import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { StaffErrors } from "../errors";

export class RemoveStaff {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, staffId: string): Promise<void> {
		// Only a manager/attendant/kitchen staff member within the caller's own company may be removed (never the owner).
		const target = await this.prisma.user.findFirst({
			where: { companyId, id: staffId, role: { in: ["manager", "attendant", "kitchen"] } },
		});
		if (!companyId || !target) {
			throw new DomainError(StaffErrors.STAFF_NOT_FOUND);
		}

		await this.prisma.user.delete({ where: { id: staffId } });
	}
}
