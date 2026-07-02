import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CompanyReturn, CreateCompanyDTO } from "../dtos";
import { CompanyErrors } from "../errors";

export class CreateCompany {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({ name, slug }: CreateCompanyDTO): Promise<CompanyReturn> {
		const existing = await this.prisma.company.findUnique({ where: { slug } });
		if (existing) {
			throw new DomainError(CompanyErrors.SLUG_TAKEN);
		}

		return this.prisma.company.create({ data: { name, slug } });
	}
}
