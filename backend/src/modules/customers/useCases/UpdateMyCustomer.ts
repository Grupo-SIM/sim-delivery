import { DomainError } from "@/shared/errors";
import { isValidCpf } from "@/shared/cpf";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CustomerReturn, UpdateCustomerBody } from "../dtos";
import { CustomerErrors } from "../errors";

export class UpdateMyCustomer {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, data: UpdateCustomerBody): Promise<CustomerReturn> {
		const company = await this.prisma.company.findUnique({ where: { slug: data.slug } });
		if (!company) throw new DomainError(CustomerErrors.COMPANY_NOT_FOUND);
		if (data.cpf && !isValidCpf(data.cpf)) throw new DomainError(CustomerErrors.INVALID_CPF);

		const customer = await this.prisma.customer.upsert({
			create: { companyId: company.id, cpf: data.cpf ?? null, phone: data.phone ?? null, userId },
			update: {
				cpf: data.cpf === undefined ? undefined : data.cpf,
				phone: data.phone === undefined ? undefined : data.phone,
			},
			where: { userId },
		});

		return this.prisma.customer.findUniqueOrThrow({
			include: { addresses: { orderBy: { isDefault: "desc" }, where: { deletedAt: null } } },
			where: { id: customer.id },
		});
	}
}
