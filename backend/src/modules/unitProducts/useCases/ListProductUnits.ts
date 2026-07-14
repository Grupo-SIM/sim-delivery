import { ProductErrors } from "@/modules/products/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { ProductUnitsReturn } from "../dtos";

export class ListProductUnits {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, productId: string): Promise<ProductUnitsReturn> {
		const product = companyId
			? await this.prisma.product.findFirst({ where: { companyId, id: productId } })
			: null;
		if (!product) {
			throw new DomainError(ProductErrors.PRODUCT_NOT_FOUND);
		}

		const associations = await this.prisma.unitProduct.findMany({
			select: { unitId: true },
			where: { productId },
		});

		return associations.map(({ unitId }) => unitId);
	}
}
