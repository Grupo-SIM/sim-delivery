import type { PrismaInstance } from "@/shared/infra/sql";
import type { Role } from "@/shared/permissions";
import type { AdminOrderListReturn, ListOrdersQuery } from "../dtos";
import { getCurrentBusinessShiftStart } from "./getCurrentBusinessShiftStart";

export class ListOrders {
	constructor(private readonly prisma: PrismaInstance) {}
	async execute(
		companyId: string | null,
		query: ListOrdersQuery,
		role?: Role,
		userId?: string,
	): Promise<AdminOrderListReturn> {
		const { customerId, deliveryMethod, from, hasCoupon, search, status, to, unitId } = query;
		const staffUnitScope =
			(role === "courier" || role === "kitchen") && userId ? { staffUnits: { some: { userId } } } : {};
		const shiftStarts =
			!from && !to
				? await this.prisma.unit.findMany({
						select: { hours: true, id: true },
						where: {
							...(companyId ? { companyId } : {}),
							...staffUnitScope,
							...(unitId ? { id: unitId } : {}),
						},
					})
				: [];
		const currentShiftFilter =
			!from && !to
				? {
						OR: shiftStarts.map(unit => ({
							createdAt: { gte: getCurrentBusinessShiftStart(unit.hours) },
							unitId: unit.id,
						})),
					}
				: null;
		const searchFilter = search
			? {
						OR: [
							{ id: { contains: search } },
							{ customer: { user: { name: { contains: search, mode: "insensitive" as const } } } },
							{ customer: { phone: { contains: search } } },
						],
					}
			: null;
		const orders = await this.prisma.order.findMany({
			include: {
				coupon: { select: { code: true, type: true, value: true } },
				customer: { include: { user: true } },
				delivery: { select: { courier: { select: { name: true } }, courierId: true, id: true } },
				items: { include: { optionSnapshots: true } },
				payment: { select: { status: true } },
				preparedBy: { select: { id: true, name: true } },
				unit: true,
			},
			orderBy: { createdAt: "desc" },
			where: {
				...(companyId ? { companyId } : {}),
				...((role === "courier" || role === "kitchen") && userId
					? {
							...(role === "courier" ? { deliveryMethod: "delivery" } : {}),
							unit: staffUnitScope,
						}
					: {}),
				...(customerId ? { customerId } : {}),
				...(deliveryMethod ? { deliveryMethod } : {}),
				...(status ? { status } : {}),
				...(unitId ? { unitId } : {}),
				...(hasCoupon !== undefined ? (hasCoupon ? { couponId: { not: null } } : { couponId: null }) : {}),
				...(from || to
					? {
							createdAt: {
								...(from ? { gte: new Date(from) } : {}),
								...(to ? { lte: new Date(to) } : {}),
							},
						}
					: {}),
				...(currentShiftFilter && searchFilter
					? { AND: [currentShiftFilter, searchFilter] }
					: currentShiftFilter ?? searchFilter ?? {}),
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
			delivery: o.delivery
				? { courierId: o.delivery.courierId, courierName: o.delivery.courier.name, id: o.delivery.id }
				: null,
			deliveryFee: o.deliveryFee,
			deliveryMethod: o.deliveryMethod,
			displayNumber: o.displayNumber,
			discountCents: o.discountCents,
			id: o.id,
			items: o.items.map(item => ({
				...item,
				imageUrl: imageUrlByProductId.get(item.productId) ?? null,
				options: item.optionSnapshots,
			})),
			loyaltyPointsRedeemed: o.loyaltyPointsRedeemed,
			payment: o.payment ? { status: o.payment.status } : null,
			preparedBy: o.preparedBy,
			problemReason: o.problemReason,
			refundedCents: o.refundedCents,
			status: o.status,
			subtotal: o.subtotal,
			total: o.total,
			unitId: o.unitId,
			unitName: o.unit.name,
			unitPrepTimeMaxMinutes: o.unit.prepTimeMaxMinutes,
			unitPrepTimeMinMinutes: o.unit.prepTimeMinMinutes,
			updatedAt: o.updatedAt,
		}));
	}
}
