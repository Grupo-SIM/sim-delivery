import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { DiscountErrors } from "../errors";

export class DeleteDiscount {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, discountId: string): Promise<void> {
		const discount = await this.prisma.discount.findFirst({
			where: { ...(companyId ? { companyId } : {}), id: discountId },
		});
		if (!discount) {
			throw new DomainError(DiscountErrors.DISCOUNT_NOT_FOUND);
		}

		await this.prisma.discount.delete({ where: { id: discountId } });
	}
}
