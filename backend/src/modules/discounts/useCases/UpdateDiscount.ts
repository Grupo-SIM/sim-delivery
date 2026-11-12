import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { DiscountReturn, UpdateDiscountBody } from "../dtos";
import { DiscountErrors } from "../errors";
import { assertValidDiscount } from "../validate";

export class UpdateDiscount {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, discountId: string, data: UpdateDiscountBody): Promise<DiscountReturn> {
		const discount = await this.prisma.discount.findFirst({
			where: { ...(companyId ? { companyId } : {}), id: discountId },
		});
		if (!discount) {
			throw new DomainError(DiscountErrors.DISCOUNT_NOT_FOUND);
		}

		const startsAt = data.startsAt === undefined ? discount.startsAt : data.startsAt && new Date(data.startsAt);
		const endsAt = data.endsAt === undefined ? discount.endsAt : data.endsAt && new Date(data.endsAt);
		assertValidDiscount({
			endsAt,
			startsAt,
			type: data.type ?? discount.type,
			value: data.value ?? discount.value,
		});

		return this.prisma.discount.update({
			data: { ...data, endsAt, startsAt },
			where: { id: discountId },
		});
	}
}
