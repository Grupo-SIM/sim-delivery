import type { PrismaInstance } from "@/shared/infra/sql";
import type { DeliveryListReturn, ListDeliveriesQuery } from "../dtos";

export class ListDeliveries {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, query: ListDeliveriesQuery): Promise<DeliveryListReturn> {
		const { courierId, status } = query;

		const deliveries = await this.prisma.delivery.findMany({
			include: {
				courier: { select: { name: true } },
				order: {
					include: {
						address: {
							select: {
								addressLine: true,
								city: true,
								complement: true,
								neighborhood: true,
								number: true,
								state: true,
								zipCode: true,
							},
						},
						customer: { include: { user: true } },
						items: true,
					},
				},
				unit: true,
			},
			orderBy: { assignedAt: "desc" },
			where: {
				...(companyId ? { companyId } : {}),
				...(courierId ? { courierId } : {}),
				...(status ? { status } : {}),
			},
		});

		return deliveries.map(d => ({
			acceptedAt: d.acceptedAt,
			assignedAt: d.assignedAt,
			companyId: d.companyId,
			courierId: d.courierId,
			courierName: d.courier.name ?? "",
			createdAt: d.createdAt,
			deliveredAt: d.deliveredAt,
			departedAt: d.departedAt,
			id: d.id,
			order: {
				address: d.order.address ?? null,
				customerName: d.order.customer.user.name ?? "",
				deliveryMethod: d.order.deliveryMethod,
				id: d.order.id,
				items: d.order.items.map(i => ({
					id: i.id,
					note: i.note,
					productName: i.productName,
					quantity: i.quantity,
				})),
				total: d.order.total,
			},
			orderId: d.orderId,
			status: d.status,
			unitId: d.unitId,
			unitName: d.unit.name,
			updatedAt: d.updatedAt,
		}));
	}
}
