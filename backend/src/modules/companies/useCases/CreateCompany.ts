import { WithdrawalErrors } from "@/modules/withdrawals/errors";
import { DomainError } from "@/shared/errors";
import { simpayIntegrationKey, type SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CompanyReturn, CreateCompanyDTO } from "../dtos";
import { CompanyErrors } from "../errors";

export class CreateCompany {
	constructor(private readonly prisma: PrismaInstance, private readonly simpay: Pick<SimpayClient, "provisionPlatform">) {}

	async execute(input: CreateCompanyDTO): Promise<CompanyReturn> {
		const data = { ...input, ownerEmail: input.ownerEmail?.trim().toLowerCase() ?? input.ownerEmail };
		const existing = await this.prisma.company.findUnique({ where: { slug: data.slug } });
		if (existing) {
			// A failed provider request keeps the company. Exact retries before the first
			// owner resume reservation, without changing another company's configuration.
			const sameData = ["apiUrl", "name", "ownerEmail", "packageName", "siteUrl", "slug"].every(
				key => (existing[key as keyof typeof existing] ?? null) === (data[key as keyof typeof data] ?? null),
			);
			if (!sameData || await this.prisma.user.findFirst({ where: { companyId: existing.id, role: "owner" } })) {
				throw new DomainError(CompanyErrors.SLUG_TAKEN);
			}
		}
		const company = existing ?? await this.prisma.company.create({ data });
		try {
			await this.simpay.provisionPlatform({ externalMerchantId: company.id, integrationKey: simpayIntegrationKey(company.slug) }, company.name);
		} catch (error) {
			throw new DomainError(WithdrawalErrors.WITHDRAWAL_PROVIDER_ERROR, `Empresa criada; repita com os mesmos dados ou cadastre o primeiro dono para retomar a integração. ${error instanceof Error ? error.message : "Falha na SIM INT PAY."}`);
		}
		return company;
	}
}
