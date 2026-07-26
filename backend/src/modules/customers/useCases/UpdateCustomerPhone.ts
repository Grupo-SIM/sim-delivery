import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CustomerErrors } from "../errors";

export class UpdateCustomerPhone {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, phone: string): Promise<void> {
		const customer = await this.prisma.customer.findUnique({ where: { userId } });
		if (!customer) throw new DomainError(CustomerErrors.CUSTOMER_NOT_FOUND);
		await this.prisma.customer.update({ data: { phone }, where: { id: customer.id } });
	}
}
