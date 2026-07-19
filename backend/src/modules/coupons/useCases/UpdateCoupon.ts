import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CouponReturn, UpdateCouponBody } from "../dtos";
import { CouponErrors } from "../errors";

export class UpdateCoupon {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, couponId: string, data: UpdateCouponBody): Promise<CouponReturn> {
		if (!companyId) {
			throw new DomainError(CouponErrors.NO_COMPANY);
		}

		const coupon = await this.prisma.coupon.findFirst({
			where: { companyId, id: couponId },
		});
		if (!coupon) {
			throw new DomainError(CouponErrors.COUPON_NOT_FOUND);
		}

		const code = data.code ? data.code.toUpperCase() : undefined;
		if (code && code !== coupon.code) {
			const clash = await this.prisma.coupon.findUnique({
				where: { companyId_code: { code, companyId: coupon.companyId } },
			});
			if (clash) {
				throw new DomainError(CouponErrors.CODE_TAKEN);
			}
		}

		return this.prisma.coupon.update({
			data: {
				...data,
				...(code !== undefined && { code }),
				...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }),
			},
			where: { id: couponId },
		});
	}
}
