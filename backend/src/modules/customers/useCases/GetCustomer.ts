import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CustomerAdminReturn } from "../dtos";
import { CustomerErrors } from "../errors";

export class GetCustomer {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, customerId: string): Promise<CustomerAdminReturn> {
		const customer = await this.prisma.customer.findFirst({
			include: {
				addresses: { orderBy: { isDefault: "desc" }, where: { deletedAt: null } },
				cashbackLedger: { select: { amount: true } },
				orders: { orderBy: { createdAt: "desc" }, select: { createdAt: true, total: true } },
				user: { select: { email: true, name: true } },
			},
			where: { ...(companyId ? { companyId } : {}), id: customerId },
		});

		if (!customer) throw new DomainError(CustomerErrors.CUSTOMER_NOT_FOUND);

		const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0);
		const orderCount = customer.orders.length;
		return {
			...customer,
			averageTicket: orderCount === 0 ? 0 : Math.round(totalSpent / orderCount),
			cashbackBalance: customer.cashbackLedger.reduce((sum, entry) => sum + entry.amount, 0),
			email: customer.user.email,
			lastOrderAt: customer.orders[0]?.createdAt ?? null,
			name: customer.user.name,
			orderCount,
			totalSpent,
		};
	}
}
