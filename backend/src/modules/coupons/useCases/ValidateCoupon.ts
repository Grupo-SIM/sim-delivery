import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { ValidateCouponBody, ValidateCouponReturn } from "../dtos";
import { CouponErrors } from "../errors";

export class ValidateCoupon {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(data: ValidateCouponBody): Promise<ValidateCouponReturn> {
		const { code, orderSubtotal, unitId, slug } = data;

		const company = await this.prisma.company.findUnique({ where: { slug } });
		if (!company) throw new DomainError(CouponErrors.COMPANY_NOT_FOUND);

		const coupon = await this.prisma.coupon.findUnique({
			where: { companyId_code: { code: code.toUpperCase(), companyId: company.id } },
		});
		if (!coupon || !coupon.active) throw new DomainError(CouponErrors.COUPON_NOT_FOUND);

		if (coupon.unitId && coupon.unitId !== unitId) throw new DomainError(CouponErrors.COUPON_NOT_FOUND);

		if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new DomainError(CouponErrors.COUPON_EXPIRED);

		if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
			throw new DomainError(CouponErrors.COUPON_EXHAUSTED);
		}

		if (orderSubtotal < coupon.minOrderCents) throw new DomainError(CouponErrors.ORDER_TOO_SMALL);

		const discountCents =
			coupon.type === "percent"
				? Math.round((orderSubtotal * coupon.value) / 100)
				: Math.min(coupon.value, orderSubtotal);

		return {
			couponId: coupon.id,
			discountCents,
			type: coupon.type as "percent" | "fixed",
			value: coupon.value,
		};
	}
}
