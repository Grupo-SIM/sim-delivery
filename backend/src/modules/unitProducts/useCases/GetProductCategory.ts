import { ProductErrors } from "@/modules/products/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { ProductCategoryReturn } from "../dtos";

export class GetProductCategory {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, productId: string): Promise<ProductCategoryReturn> {
		const product = companyId
			? await this.prisma.product.findFirst({ where: { companyId, id: productId } })
			: null;
		if (!product) {
			throw new DomainError(ProductErrors.PRODUCT_NOT_FOUND);
		}

		const association = await this.prisma.unitProduct.findFirst({
			select: { categoryId: true },
			where: { categoryId: { not: null }, productId },
		});

		return { categoryId: association?.categoryId ?? null };
	}
}
