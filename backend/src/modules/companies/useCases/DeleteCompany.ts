import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CompanyErrors } from "../errors";

export class DeleteCompany {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string): Promise<void> {
		const company = await this.prisma.company.findUnique({ where: { id: companyId } });
		if (!company) {
			throw new DomainError(CompanyErrors.COMPANY_NOT_FOUND);
		}

		await this.prisma.company.delete({ where: { id: companyId } });
	}
}
