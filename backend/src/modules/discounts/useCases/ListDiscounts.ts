import type { PrismaInstance } from "@/shared/infra/sql";
import type { DiscountListReturn } from "../dtos";

export class ListDiscounts {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<DiscountListReturn> {
		return this.prisma.discount.findMany({
			orderBy: [{ createdAt: "desc" }],
			where: companyId ? { companyId } : {},
		});
	}
}
