import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CouponListReturn } from "../dtos";
import { CouponErrors } from "../errors";

export class ListCoupons {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<CouponListReturn> {
		if (!companyId) {
			throw new DomainError(CouponErrors.NO_COMPANY);
		}

		return this.prisma.coupon.findMany({
			orderBy: { createdAt: "desc" },
			where: { companyId },
		});
	}
}
