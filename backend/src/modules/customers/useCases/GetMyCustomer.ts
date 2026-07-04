import type { PrismaInstance } from "@/shared/infra/sql";
import type { CustomerReturn } from "../dtos";

export class GetMyCustomer {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, variantKey: string): Promise<CustomerReturn | null> {
		const company = await this.prisma.company.findUnique({ where: { variantKey } });
		if (!company) return null;

		return this.prisma.customer.findFirst({
			include: { addresses: { orderBy: { isDefault: "desc" } } },
			where: { companyId: company.id, userId },
		});
	}
}
