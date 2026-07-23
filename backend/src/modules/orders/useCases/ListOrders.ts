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
				coupon: { select: { code: true, type: true, value: true } },
				customer: { include: { user: true } },
				delivery: { select: { courierId: true, courier: { select: { name: true } }, id: true } },
				items: { include: { optionSnapshots: true } },
				preparedBy: { select: { id: true, name: true } },
				unit: true,
			},
			orderBy: { createdAt: "desc" },
			where: {
				...(companyId ? { companyId } : {}),
				...((role === "courier" || role === "kitchen") && userId
					? { ...(role === "courier" ? { deliveryMethod: "delivery" } : {}), unit: { courierUnits: { some: { courierId: userId } } } }
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
		const productIds = [...new Set(orders.flatMap(order => order.items.map(item => item.productId)))];
		const products = await this.prisma.product.findMany({
			select: { id: true, imageUrl: true },
			where: { id: { in: productIds } },
		});
		const imageUrlByProductId = new Map(products.map(product => [product.id, product.imageUrl || null]));
		return orders.map(o => ({
			addressId: o.addressId,
			cancelReason: o.cancelReason,
			cashbackCentsRedeemed: o.cashbackCentsRedeemed,
			companyId: o.companyId,
			couponCode: o.coupon?.code ?? null,
			couponId: o.couponId,
			couponType: o.coupon?.type ?? null,
			couponValue: o.coupon?.value ?? null,
			createdAt: o.createdAt,
			customerId: o.customerId,
			customerName: o.customer.user.name ?? "",
			customerPhone: o.customer.phone ?? null,
			delivery: o.delivery ? { courierId: o.delivery.courierId, courierName: o.delivery.courier.name, id: o.delivery.id } : null,
			deliveryFee: o.deliveryFee,
			deliveryMethod: o.deliveryMethod,
			discountCents: o.discountCents,
			id: o.id,
			items: o.items.map(item => ({
				...item,
				imageUrl: imageUrlByProductId.get(item.productId) ?? null,
				options: item.optionSnapshots,
			})),
			loyaltyPointsRedeemed: o.loyaltyPointsRedeemed,
			preparedBy: o.preparedBy,
			problemReason: o.problemReason,
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
