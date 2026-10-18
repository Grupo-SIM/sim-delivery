import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CompanyReturn, CreateCompanyDTO } from "../dtos";
import { CompanyErrors } from "../errors";

export class CreateCompany {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({
		apiUrl,
		name,
		ownerEmail,
		packageName,
		siteUrl,
		slug,
	}: CreateCompanyDTO): Promise<CompanyReturn> {
		const existing = await this.prisma.company.findUnique({ where: { slug } });
		if (existing) {
			throw new DomainError(CompanyErrors.SLUG_TAKEN);
		}

		return this.prisma.company.create({
			data: {
				apiUrl,
				name,
				ownerEmail: ownerEmail?.trim().toLowerCase() ?? ownerEmail,
				packageName,
				siteUrl,
				slug,
			},
		});
	}
}
