import { UserErrors } from "@/modules/users/errors";
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

		try {
			return await this.prisma.$transaction(async tx => {
				const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
				// Better Auth uses E.164, while the customer contact stores digits only.
				const phoneNumber = `+${data.phone}`;
				if (user.phoneNumber !== phoneNumber) {
					await tx.user.update({
						data: {
							phoneNumber,
							phoneNumberVerified: user.phoneNumber?.replace(/\D/g, "") === data.phone
								? user.phoneNumberVerified
								: false,
						},
						where: { id: userId },
					});
				}
				const customer = await tx.customer.upsert({
					create: { companyId: company.id, cpf: data.cpf, phone: data.phone, userId },
					update: { cpf: data.cpf, phone: data.phone },
					where: { companyId_userId: { companyId: company.id, userId } },
				});

				return tx.customer.findUniqueOrThrow({
					include: { addresses: { orderBy: { isDefault: "desc" }, where: { deletedAt: null } } },
					where: { id: customer.id },
				});
			});
		} catch (error) {
			if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
				throw new DomainError(UserErrors.ACCOUNT_ALREADY_EXISTS);
			}
			throw error;
		}
	}
}
