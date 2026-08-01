import type { PrismaInstance } from "@/shared/infra/sql";
import type { StaffListReturn } from "../dtos";

export class ListCouriers {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<StaffListReturn> {
		const couriers = await this.prisma.user.findMany({
			orderBy: { name: "asc" },
			select: {
				createdAt: true,
				email: true,
				id: true,
				name: true,
				role: true,
				staffUnits: { select: { unitId: true } },
			},
			where: { ...(companyId ? { companyId } : {}), role: "courier" },
		});

		return couriers.map(({ staffUnits, ...courier }) => ({
			...courier,
			unitIds: staffUnits.map(({ unitId }) => unitId),
		})) as StaffListReturn;
	}
}
