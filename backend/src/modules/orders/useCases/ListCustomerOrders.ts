import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CustomerOrderListReturn } from "../dtos";
import { OrderErrors } from "../errors";

export class ListCustomerOrders {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, slug: string): Promise<CustomerOrderListReturn> {
		const company = await this.prisma.company.findUnique({ where: { slug } });
		if (!company) throw new DomainError(OrderErrors.ORDER_NOT_FOUND);

		const orders = await this.prisma.order.findMany({
			include: {
				_count: { select: { items: true } },
				unit: { select: { name: true, slug: true } },
			},
			orderBy: { createdAt: "desc" },
			where: { companyId: company.id, customer: { userId } },
		});

		return orders.map(order => ({
			createdAt: order.createdAt,
			deliveryMethod: order.deliveryMethod,
			displayNumber: order.displayNumber,
			id: order.id,
			itemsCount: order._count.items,
			status: order.status,
			total: order.total,
			unitName: order.unit.name,
			unitSlug: order.unit.slug,
		}));
	}
}
