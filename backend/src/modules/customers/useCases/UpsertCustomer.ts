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

		await this.prisma.user.update({ data: { name }, where: { id: userId } });

		const customer = await this.prisma.customer.upsert({
			create: { companyId: company.id, cpf: cpf ?? null, userId },
			update: { cpf: cpf ?? undefined },
			where: { userId },
		});

		await this.prisma.address.updateMany({
			data: { isDefault: false },
			where: { customerId: customer.id, isDefault: true },
		});
		await this.prisma.address.create({
			data: { ...this.mapAddress(address), customerId: customer.id, isDefault: true },
		});

		return this.prisma.customer.findUniqueOrThrow({
			include: { addresses: { orderBy: { isDefault: "desc" }, where: { deletedAt: null } } },
			where: { id: customer.id },
		});
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
