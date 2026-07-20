import type { PrismaInstance } from "@/shared/infra/sql";
import type { CustomerListReturn, ListCustomersQuery } from "../dtos";

interface CustomerMetricSource {
	cashbackLedger: { amount: number }[];
	companyId: string;
	createdAt: Date;
	cpf: string | null;
	domId: string | null;
	id: string;
	orders: { createdAt: Date; total: number }[];
	phone: string | null;
	updatedAt: Date;
	user: { email: string; name: string };
	userId: string;
}

export class ListCustomers {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, query: ListCustomersQuery): Promise<CustomerListReturn> {
		const page = query.page ?? 1;
		const pageSize = query.pageSize ?? 20;
		const search = query.search?.trim();

		const where = {
			...(companyId ? { companyId } : {}),
			...(search
				? {
					OR: [
						{ cpf: { contains: search } },
						{ phone: { contains: search } },
						{ user: { email: { contains: search, mode: "insensitive" } } },
						{ user: { name: { contains: search, mode: "insensitive" } } },
					],
				}
				: {}),
		};

		const [foundCustomers, total] = await Promise.all([
			this.prisma.customer.findMany({
				include: {
					cashbackLedger: { select: { amount: true } },
					orders: { orderBy: { createdAt: "desc" }, select: { createdAt: true, total: true } },
					user: { select: { email: true, name: true } },
				},
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * pageSize,
				take: pageSize,
				where: where as never,
			}),
			this.prisma.customer.count({ where: where as never }),
		]);
		const customers = foundCustomers as unknown as CustomerMetricSource[];

		return {
			items: customers.map(customer => {
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
			}),
			page,
			pageSize,
			total,
		};
	}
}
