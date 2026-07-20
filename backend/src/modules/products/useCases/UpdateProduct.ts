import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { slugify } from "@/shared/slug";
import type { ProductReturn, UpdateProductBody } from "../dtos";
import { ProductErrors } from "../errors";
import { mapProductTaxonomy, productTaxonomyInclude, validateTaxonomy } from "./taxonomy";

export class UpdateProduct {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		productId: string,
		data: UpdateProductBody,
	): Promise<ProductReturn> {
		const product = await this.prisma.product.findFirst({
			where: { ...(companyId ? { companyId } : {}), id: productId },
		});
		if (!product) throw new DomainError(ProductErrors.PRODUCT_NOT_FOUND);
		const { categoryIds, tagIds, ...fields } = data;
		await validateTaxonomy(this.prisma, product.companyId, categoryIds, tagIds);
		const updated = await this.prisma.$transaction(async transaction => {
			await transaction.product.update({
				data: { ...fields, ...(data.title && { slug: slugify(data.title, "produto") }) },
				where: { id: productId },
			});

			if (categoryIds !== undefined) {
				await transaction.productCategory.deleteMany({ where: { productId } });
				if (categoryIds.length > 0) {
					await transaction.productCategory.createMany({
						data: categoryIds.map(categoryId => ({ categoryId, productId })),
					});
				}
			}

			if (tagIds !== undefined) {
				await transaction.productTag.deleteMany({ where: { productId } });
				if (tagIds.length > 0) {
					await transaction.productTag.createMany({
						data: tagIds.map(tagId => ({ productId, tagId })),
					});
				}
			}

			return transaction.product.findUniqueOrThrow({
				include: productTaxonomyInclude,
				where: { id: productId },
			});
		});
		return mapProductTaxonomy(updated);
	}
}
