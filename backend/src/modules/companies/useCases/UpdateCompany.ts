import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CompanyReturn, UpdateCompanyDTO } from "../dtos";
import { CompanyErrors } from "../errors";

export class UpdateCompany {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({ companyId, name, variantKey }: UpdateCompanyDTO): Promise<CompanyReturn> {
		const company = await this.prisma.company.findUnique({ where: { id: companyId } });
		if (!company) {
			throw new DomainError(CompanyErrors.COMPANY_NOT_FOUND);
		}

		if (variantKey) {
			const clash = await this.prisma.company.findUnique({ where: { variantKey } });
			if (clash && clash.id !== companyId) {
				throw new DomainError(CompanyErrors.VARIANT_TAKEN);
			}
		}

		return this.prisma.company.update({
			data: {
				...(name !== undefined && { name }),
				...(variantKey !== undefined && { variantKey }),
			},
			where: { id: companyId },
		});
	}
}
