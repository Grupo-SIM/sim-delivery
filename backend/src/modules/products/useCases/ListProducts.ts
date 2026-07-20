import type { PrismaInstance } from "@/shared/infra/sql";
import type { ProductListReturn } from "../dtos";
import { mapProductTaxonomy, productTaxonomyInclude } from "./taxonomy";

export class ListProducts {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<ProductListReturn> {
		const products = await this.prisma.product.findMany({
			include: productTaxonomyInclude,
			orderBy: [{ title: "asc" }],
			where: { ...(companyId ? { companyId } : {}) },
		});
		return products.map(mapProductTaxonomy);
	}
}
