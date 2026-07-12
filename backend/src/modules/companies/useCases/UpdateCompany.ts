import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CompanyReturn, UpdateCompanyDTO } from "../dtos";
import { CompanyErrors } from "../errors";

export class UpdateCompany {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({ companyId, name, slug }: UpdateCompanyDTO): Promise<CompanyReturn> {
		const company = await this.prisma.company.findUnique({ where: { id: companyId } });
		if (!company) {
			throw new DomainError(CompanyErrors.COMPANY_NOT_FOUND);
		}

		if (slug) {
			const clash = await this.prisma.company.findUnique({ where: { slug } });
			if (clash && clash.id !== companyId) {
				throw new DomainError(CompanyErrors.SLUG_TAKEN);
			}
		}

		return this.prisma.company.update({
			data: {
				...(name !== undefined && { name }),
				...(slug !== undefined && { slug }),
			},
			where: { id: companyId },
		});
	}
}
