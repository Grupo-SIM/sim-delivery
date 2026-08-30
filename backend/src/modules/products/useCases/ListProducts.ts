import type { PrismaInstance } from "@/shared/infra/sql";
import type { Role } from "@/shared/permissions";
import type { ProductListReturn } from "../dtos";
import { mapProductTaxonomy, productTaxonomyInclude } from "./taxonomy";

export class ListProducts {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, role?: Role, userId?: string): Promise<ProductListReturn> {
		const staffUserId = role !== undefined && !["owner", "superAdmin"].includes(role) ? userId : undefined;
		const staffUnitScope = staffUserId
				? { unitProducts: { some: { unit: { staffUnits: { some: { userId: staffUserId } } } } } }
				: {};
		const products = await this.prisma.product.findMany({
			include: productTaxonomyInclude,
			orderBy: [{ title: "asc" }],
			where: { ...(companyId ? { companyId } : {}), ...staffUnitScope },
		});
		return products.map(mapProductTaxonomy);
	}
}
