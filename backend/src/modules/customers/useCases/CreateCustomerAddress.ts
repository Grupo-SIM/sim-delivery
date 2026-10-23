import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CreateCustomerAddressBody, CustomerReturn } from "../dtos";
import { CustomerErrors } from "../errors";

export class CreateCustomerAddress {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, data: CreateCustomerAddressBody): Promise<CustomerReturn> {
		const company = await this.prisma.company.findUnique({ where: { slug: data.slug } });
		if (!company) throw new DomainError(CustomerErrors.COMPANY_NOT_FOUND);

		const customer = await this.prisma.customer.upsert({
			create: { companyId: company.id, userId },
			update: {},
			where: { companyId_userId: { companyId: company.id, userId } },
		});
		const activeAddressCount = await this.prisma.address.count({
			where: { customerId: customer.id, deletedAt: null },
		});
		const isDefault = data.isDefault !== false || activeAddressCount === 0;

		if (isDefault) {
			await this.prisma.address.updateMany({
				data: { isDefault: false },
				where: { customerId: customer.id, isDefault: true },
			});
		}

		await this.prisma.address.create({
			data: {
				addressLine: data.addressLine,
				city: data.city ?? null,
				complement: data.complement ?? null,
				customerId: customer.id,
				isDefault,
				label: data.label ?? null,
				latitude: data.latitude ?? null,
				longitude: data.longitude ?? null,
				neighborhood: data.neighborhood ?? null,
				number: data.number,
				reference: data.reference ?? null,
				state: data.state ?? null,
				zipCode: data.zipCode,
			},
		});

		return this.prisma.customer.findUniqueOrThrow({
			include: { addresses: { orderBy: { isDefault: "desc" }, where: { deletedAt: null } } },
			where: { id: customer.id },
		});
	}
}
