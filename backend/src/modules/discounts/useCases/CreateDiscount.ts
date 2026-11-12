import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CreateDiscountBody, DiscountReturn } from "../dtos";
import { DiscountErrors } from "../errors";
import { assertValidDiscount } from "../validate";

export class CreateDiscount {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, data: CreateDiscountBody): Promise<DiscountReturn> {
		if (!companyId) {
			throw new DomainError(DiscountErrors.NO_COMPANY);
		}

		const startsAt = data.startsAt ? new Date(data.startsAt) : null;
		const endsAt = data.endsAt ? new Date(data.endsAt) : null;
		assertValidDiscount({ endsAt, startsAt, type: data.type, value: data.value });

		return this.prisma.discount.create({ data: { ...data, companyId, endsAt, startsAt } });
	}
}
