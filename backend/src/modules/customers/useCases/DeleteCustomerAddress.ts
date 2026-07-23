import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CustomerErrors } from "../errors";

export class DeleteCustomerAddress {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, addressId: string): Promise<void> {
		const address = await this.prisma.address.findFirst({
			where: { customer: { userId }, deletedAt: null, id: addressId },
		});
		if (!address) throw new DomainError(CustomerErrors.CUSTOMER_NOT_FOUND);

		await this.prisma.address.update({ data: { deletedAt: new Date(), isDefault: false }, where: { id: addressId } });
		if (address.isDefault) {
			const replacement = await this.prisma.address.findFirst({
				orderBy: { createdAt: "desc" },
				where: { customerId: address.customerId, deletedAt: null },
			});
			if (replacement) await this.prisma.address.update({ data: { isDefault: true }, where: { id: replacement.id } });
		}
	}
}
