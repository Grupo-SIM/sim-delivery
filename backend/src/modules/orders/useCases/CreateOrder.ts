import { CashbackErrors } from "@/modules/cashback/errors";
import { GetCashbackBalance } from "@/modules/cashback/useCases";
import { ValidateCoupon } from "@/modules/coupons/useCases";
import { LoyaltyErrors } from "@/modules/loyalty/errors";
import { GetLoyaltyBalance } from "@/modules/loyalty/useCases";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CreateOrderBody, OrderReturn } from "../dtos";
import { OrderErrors } from "../errors";

export class CreateOrder {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, data: CreateOrderBody): Promise<OrderReturn> {
		const {
			addressId,
			couponCode,
			deliveryMethod,
			items,
			redeemCashbackCents,
			redeemLoyaltyPoints,
			unitId,
			slug,
		} = data;

		if (items.length === 0) throw new DomainError(OrderErrors.EMPTY_ORDER);

		const company = await this.prisma.company.findUnique({ where: { slug } });
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
				slug,
				unitId,
			});
			couponId = couponResult.couponId;
			discountCents = couponResult.discountCents;
		}

		let cashbackCentsRedeemed = 0;
		if (redeemCashbackCents && redeemCashbackCents > 0) {
			const { balanceCents } = await new GetCashbackBalance(this.prisma).execute(userId, slug);
			if (redeemCashbackCents > balanceCents) throw new DomainError(CashbackErrors.INSUFFICIENT_BALANCE);
			cashbackCentsRedeemed = redeemCashbackCents;
		}

		let loyaltyPointsRedeemed = 0;
		if (redeemLoyaltyPoints && redeemLoyaltyPoints > 0) {
			const { balancePoints } = await new GetLoyaltyBalance(this.prisma).execute(userId, slug);
			if (redeemLoyaltyPoints > balancePoints) throw new DomainError(LoyaltyErrors.INSUFFICIENT_BALANCE);
			loyaltyPointsRedeemed = redeemLoyaltyPoints;
		}

		const total = Math.max(
			0,
			subtotal + deliveryFee - discountCents - cashbackCentsRedeemed - loyaltyPointsRedeemed,
		);

		const order = await this.prisma.$transaction(async tx => {
			const created = await tx.order.create({
				data: {
					addressId: addressId ?? null,
					cashbackCentsRedeemed,
					companyId: company.id,
					couponId,
					customerId: customer.id,
					deliveryFee,
					deliveryMethod,
					discountCents,
					loyaltyPointsRedeemed,
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

			if (cashbackCentsRedeemed > 0) {
				await tx.cashbackLedger.create({
					data: {
						amount: -cashbackCentsRedeemed,
						customerId: customer.id,
						orderId: created.id,
						type: "redemption",
					},
				});
			}

			if (loyaltyPointsRedeemed > 0) {
				await tx.loyaltyLedger.create({
					data: {
						amount: -loyaltyPointsRedeemed,
						customerId: customer.id,
						orderId: created.id,
						type: "redemption",
					},
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
