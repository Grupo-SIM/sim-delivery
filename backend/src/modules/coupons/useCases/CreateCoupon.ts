import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CouponReturn, CreateCouponBody } from "../dtos";
import { CouponErrors } from "../errors";

export class CreateCoupon {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, data: CreateCouponBody): Promise<CouponReturn> {
		if (!companyId) {
			throw new DomainError(CouponErrors.NO_COMPANY);
		}

		const code = data.code.toUpperCase();
		const existing = await this.prisma.coupon.findUnique({
			where: { companyId_code: { code, companyId } },
		});
		if (existing) {
			throw new DomainError(CouponErrors.CODE_TAKEN);
		}

		return this.prisma.coupon.create({
			data: {
				...data,
				code,
				companyId,
				expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
			},
		});
	}
}
