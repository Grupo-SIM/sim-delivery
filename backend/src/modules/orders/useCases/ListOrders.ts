import type { PrismaInstance } from "@/shared/infra/sql";
import type { ListOrdersQuery, AdminOrderListReturn } from "../dtos";

export class ListOrders {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string, query: ListOrdersQuery): Promise<AdminOrderListReturn> {
		const { status, unitId, from, to } = query;

		const orders = await this.prisma.order.findMany({
			include: {
				customer: { include: { user: true } },
				items: true,
				unit: true,
			},
			orderBy: { createdAt: "desc" },
			where: {
				companyId,
				...(status ? { status } : {}),
				...(unitId ? { unitId } : {}),
				...(from || to
					? {
							createdAt: {
								...(from ? { gte: new Date(from) } : {}),
								...(to ? { lte: new Date(to) } : {}),
							},
						}
					: {}),
			},
		});

		return orders.map(o => ({
			addressId: o.addressId,
			cancelReason: o.cancelReason,
			cashbackCentsRedeemed: o.cashbackCentsRedeemed,
			companyId: o.companyId,
			couponId: o.couponId,
			createdAt: o.createdAt,
			customerId: o.customerId,
			customerName: o.customer.user.name ?? "",
			customerPhone: o.customer.phone ?? null,
			deliveryFee: o.deliveryFee,
			deliveryMethod: o.deliveryMethod,
			discountCents: o.discountCents,
			id: o.id,
			items: o.items,
			loyaltyPointsRedeemed: o.loyaltyPointsRedeemed,
			status: o.status,
			subtotal: o.subtotal,
			total: o.total,
			unitId: o.unitId,
			unitName: o.unit.name,
			updatedAt: o.updatedAt,
		}));
	}
}
