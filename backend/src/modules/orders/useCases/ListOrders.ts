import type { PrismaInstance } from "@/shared/infra/sql";
import type { Role } from "@/shared/permissions";
import type { AdminOrderListReturn, ListOrdersQuery } from "../dtos";

export class ListOrders {
	constructor(private readonly prisma: PrismaInstance) {}
	async execute(companyId: string | null, query: ListOrdersQuery, role?: Role, userId?: string): Promise<AdminOrderListReturn> {
		const { customerId, deliveryMethod, from, hasCoupon, search, status, to, unitId } = query;
		const company = companyId ? await this.prisma.company.findUnique({ select: { orderBoardStartedAt: true }, where: { id: companyId } }) : null;
		const defaultFrom = !from && !to ? company?.orderBoardStartedAt : null;
		const orders = await this.prisma.order.findMany({
			include: {
				customer: { include: { user: true } },
				delivery: { select: { courierId: true, courier: { select: { name: true } }, id: true } },
				items: { include: { optionSnapshots: true } },
				preparedBy: { select: { id: true, name: true } },
				unit: true,
			},
			orderBy: { createdAt: "desc" },
			where: {
				...(companyId ? { companyId } : {}),
				...(role === "courier" && userId
					? { deliveryMethod: "delivery", unit: { courierUnits: { some: { courierId: userId } } } }
					: {}),
				...(customerId ? { customerId } : {}),
				...(deliveryMethod ? { deliveryMethod } : {}),
				...(status ? { status } : {}),
				...(unitId ? { unitId } : {}),
				...(hasCoupon !== undefined ? (hasCoupon ? { couponId: { not: null } } : { couponId: null }) : {}),
				...(from || to || defaultFrom ? { createdAt: { ...(from ? { gte: new Date(from) } : defaultFrom ? { gte: defaultFrom } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
				...(search ? { OR: [{ id: { contains: search } }, { customer: { user: { name: { contains: search, mode: "insensitive" } } } }, { customer: { phone: { contains: search } } }] } : {}),
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
			delivery: o.delivery ? { courierId: o.delivery.courierId, courierName: o.delivery.courier.name, id: o.delivery.id } : null,
			deliveryFee: o.deliveryFee,
			deliveryMethod: o.deliveryMethod,
			discountCents: o.discountCents,
			id: o.id,
			items: o.items.map(item => ({ ...item, options: item.optionSnapshots })),
			loyaltyPointsRedeemed: o.loyaltyPointsRedeemed,
			preparedBy: o.preparedBy,
			status: o.status,
			subtotal: o.subtotal,
			total: o.total,
			unitId: o.unitId,
			unitPrepTimeMaxMinutes: o.unit.prepTimeMaxMinutes,
			unitPrepTimeMinMinutes: o.unit.prepTimeMinMinutes,
			unitName: o.unit.name,
			updatedAt: o.updatedAt,
		}));
	}
}
