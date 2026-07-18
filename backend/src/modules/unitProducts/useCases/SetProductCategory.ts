import { CategoryErrors } from "@/modules/categories/errors";
import { ProductErrors } from "@/modules/products/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { ProductCategoryReturn } from "../dtos";

export class SetProductCategory {
	constructor(private readonly prisma: PrismaInstance) {}

	/** Applies `categoryId` to every unit this product is currently assigned to, keeping the
	 * category in sync across units instead of managing it one unit at a time. */
	async execute(
		companyId: string | null,
		productId: string,
		categoryId: string | null,
	): Promise<ProductCategoryReturn> {
		const product = companyId
			? await this.prisma.product.findFirst({ where: { companyId, id: productId } })
			: null;
		if (!product) {
			throw new DomainError(ProductErrors.PRODUCT_NOT_FOUND);
		}

		if (categoryId) {
			const category = companyId
				? await this.prisma.category.findFirst({ where: { companyId, id: categoryId } })
				: null;
			if (!category) {
				throw new DomainError(CategoryErrors.CATEGORY_NOT_FOUND);
			}
		}

		await this.prisma.unitProduct.updateMany({ data: { categoryId }, where: { productId } });

		return { categoryId };
	}
}
