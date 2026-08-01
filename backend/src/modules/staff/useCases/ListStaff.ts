import type { PrismaInstance } from "@/shared/infra/sql";
import type { StaffListReturn } from "../dtos";

export class ListStaff {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<StaffListReturn> {
		const staff = await this.prisma.user.findMany({
			orderBy: { createdAt: "asc" },
			select: {
				createdAt: true,
				email: true,
				id: true,
				name: true,
				role: true,
				staffUnits: { select: { unitId: true } },
			},
			where: {
				...(companyId ? { companyId } : {}),
				role: { in: ["owner", "manager", "attendant", "kitchen", "courier"] },
			},
		});

		return staff.map(({ staffUnits, ...member }) => ({
			...member,
			unitIds: staffUnits.map(({ unitId }) => unitId),
		})) as StaffListReturn;
	}
}
