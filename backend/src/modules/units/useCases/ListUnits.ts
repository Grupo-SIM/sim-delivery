import type { PrismaInstance } from "@/shared/infra/sql";
import type { UnitListReturn } from "../dtos";

export class ListUnits {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<UnitListReturn> {
		if (!companyId) {
			return [];
		}

		return this.prisma.unit.findMany({ orderBy: { createdAt: "asc" }, where: { companyId } });
	}
}
