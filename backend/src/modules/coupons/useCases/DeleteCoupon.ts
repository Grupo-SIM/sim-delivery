import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CouponErrors } from "../errors";

export class DeleteCoupon {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, couponId: string): Promise<void> {
		if (!companyId) {
			throw new DomainError(CouponErrors.NO_COMPANY);
		}

		const coupon = await this.prisma.coupon.findFirst({
			where: { companyId, id: couponId },
		});
		if (!coupon) {
			throw new DomainError(CouponErrors.COUPON_NOT_FOUND);
		}

		await this.prisma.coupon.delete({ where: { id: couponId } });
	}
}
