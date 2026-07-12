import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { UnitErrors } from "../errors";

export class DeleteUnit {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, unitId: string): Promise<void> {
		const unit = await this.prisma.unit.findFirst({
			where: { ...(companyId ? { companyId } : {}), id: unitId },
		});
		if (!unit) {
			throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		}

		await this.prisma.unit.delete({ where: { id: unitId } });
	}
}
