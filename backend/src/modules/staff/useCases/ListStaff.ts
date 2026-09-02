import type { Role } from "@/shared/permissions";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { StaffListReturn } from "../dtos";

export class ListStaff {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, roles?: Role[]): Promise<StaffListReturn> {
		const staff = await this.prisma.user.findMany({
			orderBy: { name: "asc" },
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
				role: { in: roles ?? ["owner", "manager", "attendant", "kitchen", "courier"] },
			},
		});

		return staff.map(({ staffUnits, ...member }) => ({
			...member,
			unitIds: staffUnits.map(({ unitId }) => unitId),
		})) as StaffListReturn;
	}
}
