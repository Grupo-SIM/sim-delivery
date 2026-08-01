import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CustomerReturn, UpdateCustomerAddressBody } from "../dtos";
import { CustomerErrors } from "../errors";

export class UpdateCustomerAddress {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, addressId: string, data: UpdateCustomerAddressBody): Promise<CustomerReturn> {
		const address = await this.prisma.address.findFirst({
			where: { customer: { userId }, deletedAt: null, id: addressId },
		});
		if (!address) throw new DomainError(CustomerErrors.CUSTOMER_NOT_FOUND);

		if (data.isDefault) {
			await this.prisma.address.updateMany({
				data: { isDefault: false },
				where: { customerId: address.customerId, isDefault: true },
			});
		}

		await this.prisma.address.update({ data, where: { id: address.id } });
		return this.prisma.customer.findUniqueOrThrow({
			include: { addresses: { orderBy: { isDefault: "desc" }, where: { deletedAt: null } } },
			where: { id: address.customerId },
		});
	}
}
