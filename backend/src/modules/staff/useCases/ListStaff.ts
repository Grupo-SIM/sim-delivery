import type { PrismaInstance } from "@/shared/infra/sql";
import type { StaffListReturn } from "../dtos";

export class ListStaff {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<StaffListReturn> {
		if (!companyId) {
			return [];
		}

		const staff = await this.prisma.user.findMany({
			orderBy: { createdAt: "asc" },
			select: { createdAt: true, email: true, id: true, level: true, name: true, role: true },
			where: { companyId, role: { in: ["owner", "employee"] } },
		});

		return staff as StaffListReturn;
	}
}
