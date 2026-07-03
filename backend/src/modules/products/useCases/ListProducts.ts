import type { PrismaInstance } from "@/shared/infra/sql";
import type { ProductListReturn } from "../dtos";

export class ListProducts {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<ProductListReturn> {
		if (!companyId) {
			return [];
		}

		return this.prisma.product.findMany({
			orderBy: [{ title: "asc" }],
			where: { companyId },
		});
	}
}
