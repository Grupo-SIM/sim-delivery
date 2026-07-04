import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ValidateCoupon } from "@/modules/coupons/useCases";
import type { CreateOrderBody, OrderReturn } from "../dtos";
import { OrderErrors } from "../errors";

export class CreateOrder {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, data: CreateOrderBody): Promise<OrderReturn> {
		const { addressId, couponCode, deliveryMethod, items, unitId, variantKey } = data;

		if (items.length === 0) throw new DomainError(OrderErrors.EMPTY_ORDER);

		const company = await this.prisma.company.findUnique({ where: { variantKey } });
		if (!company) throw new DomainError(OrderErrors.COMPANY_NOT_FOUND);

		const unit = await this.prisma.unit.findFirst({ where: { companyId: company.id, id: unitId } });
		if (!unit) throw new DomainError(OrderErrors.UNIT_NOT_FOUND);

		const customer = await this.prisma.customer.findFirst({
			where: { companyId: company.id, userId },
		});
		if (!customer) throw new DomainError(OrderErrors.CUSTOMER_NOT_FOUND);

		// Resolve prices from unit product associations
		const unitProducts = await this.prisma.unitProduct.findMany({
			include: { product: true },
			where: { id: { in: items.map(i => i.unitProductId) }, unitId },
		});

		const resolvedItems = items.map(item => {
			const assoc = unitProducts.find(up => up.id === item.unitProductId);
			if (!assoc) throw new DomainError(OrderErrors.INVALID_ITEM);
			const unitPrice = assoc.priceCentsOverride ?? assoc.product.basePriceCents;
			return {
				note: item.note ?? null,
				productId: assoc.product.id,
				productName: assoc.product.title,
				quantity: item.quantity,
				total: unitPrice * item.quantity,
				unitPrice,
			};
		});

		const subtotal = resolvedItems.reduce((sum, i) => sum + i.total, 0);
		const deliveryFee = deliveryMethod === "delivery" ? unit.deliveryFee : 0;

		let couponId: string | null = null;
		let discountCents = 0;
		if (couponCode) {
			const couponResult = await new ValidateCoupon(this.prisma).execute({
				code: couponCode,
				orderSubtotal: subtotal,
				unitId,
				variantKey,
			});
			couponId = couponResult.couponId;
			discountCents = couponResult.discountCents;
		}

		const total = Math.max(0, subtotal + deliveryFee - discountCents);

		const order = await this.prisma.$transaction(async tx => {
			const created = await tx.order.create({
				data: {
					addressId: addressId ?? null,
					companyId: company.id,
					couponId,
					customerId: customer.id,
					deliveryFee,
					deliveryMethod,
					discountCents,
					subtotal,
					total,
					unitId,
				},
			});

			if (couponId) {
				await tx.coupon.update({
					data: { usedCount: { increment: 1 } },
					where: { id: couponId },
				});
			}

			await tx.orderItem.createMany({
				data: resolvedItems.map(item => ({ ...item, orderId: created.id })),
			});

			return tx.order.findUniqueOrThrow({
				include: { items: true },
				where: { id: created.id },
			});
		});

		return order;
	}
}
