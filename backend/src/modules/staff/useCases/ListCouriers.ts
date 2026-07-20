import type { PrismaInstance } from "@/shared/infra/sql";
import type { StaffListReturn } from "../dtos";

export class ListCouriers {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<StaffListReturn> {
		const couriers = await this.prisma.user.findMany({
			orderBy: { name: "asc" },
			select: {
				courierUnits: { select: { unitId: true } },
				createdAt: true,
				email: true,
				id: true,
				name: true,
				role: true,
			},
			where: { ...(companyId ? { companyId } : {}), role: "courier" },
		});

		return couriers.map(({ courierUnits, ...courier }) => ({
			...courier,
			unitIds: courierUnits.map(({ unitId }) => unitId),
		})) as StaffListReturn;
	}
}
