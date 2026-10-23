import { UserErrors } from "@/modules/users/errors";
import { DomainError } from "@/shared/errors";
import { isValidCpf } from "@/shared/cpf";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { AddressInput, CreateCustomerBody, CustomerReturn } from "../dtos";
import { CustomerErrors } from "../errors";

export class UpsertCustomer {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, data: CreateCustomerBody): Promise<CustomerReturn> {
		const { address, cpf, name, slug } = data;

		const company = await this.prisma.company.findUnique({ where: { slug } });
		if (!company) throw new DomainError(CustomerErrors.COMPANY_NOT_FOUND);
		if (cpf && !isValidCpf(cpf)) throw new DomainError(CustomerErrors.INVALID_CPF);

		try {
			return await this.prisma.$transaction(async tx => {
				const customer = await tx.customer.upsert({
					create: { companyId: company.id, cpf: cpf ?? null, userId },
					update: { cpf: cpf ?? undefined },
					where: { companyId_userId: { companyId: company.id, userId } },
				});

				await tx.user.update({ data: { name }, where: { id: userId } });

				await tx.address.updateMany({
					data: { isDefault: false },
					where: { customerId: customer.id, isDefault: true },
				});
				await tx.address.create({
					data: { ...this.mapAddress(address), customerId: customer.id, isDefault: true },
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

	private mapAddress(address: AddressInput) {
		return {
			addressLine: address.addressLine,
			city: address.city ?? null,
			complement: address.complement ?? null,
			latitude: address.latitude ?? null,
			longitude: address.longitude ?? null,
			neighborhood: address.neighborhood ?? null,
			number: address.number,
			reference: address.reference ?? null,
			state: address.state ?? null,
			zipCode: address.zipCode,
		};
	}
}
