import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CustomerOrderTrackingReturn } from "../dtos";
import { OrderErrors } from "../errors";

export class GetCustomerOrder {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, orderId: string, slug: string): Promise<CustomerOrderTrackingReturn> {
		const company = await this.prisma.company.findUnique({ where: { slug } });
		if (!company) throw new DomainError(OrderErrors.ORDER_NOT_FOUND);

		const order = await this.prisma.order.findFirst({
			include: {
				items: { include: { optionSnapshots: true } },
				statusEvents: { orderBy: { createdAt: "asc" } },
				unit: { select: { name: true } },
			},
			where: { companyId: company.id, customer: { userId }, id: orderId },
		});
		if (!order) throw new DomainError(OrderErrors.ORDER_NOT_FOUND);

		return {
			cancelReason: order.cancelReason,
			createdAt: order.createdAt,
			deliveryMethod: order.deliveryMethod,
			id: order.id,
			items: order.items.map(item => ({ ...item, options: item.optionSnapshots })),
			status: order.status,
			statusEvents:
				order.statusEvents?.length > 0
					? order.statusEvents
					: [{ createdAt: order.createdAt, id: `${order.id}:created`, status: order.status }],
			total: order.total,
			unitName: order.unit.name,
		};
	}
}
