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
		if (!isValidCpf(data.cpf)) throw new DomainError(CustomerErrors.INVALID_CPF);

		const customer = await this.prisma.customer.upsert({
			create: { companyId: company.id, cpf: data.cpf, phone: data.phone, userId },
			update: {
				cpf: data.cpf,
				phone: data.phone,
			},
			where: { userId },
		});

		return this.prisma.customer.findUniqueOrThrow({
			include: { addresses: { orderBy: { isDefault: "desc" }, where: { deletedAt: null } } },
			where: { id: customer.id },
		});
	}
}
