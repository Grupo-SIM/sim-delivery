import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { slugify } from "@/shared/slug";
import type { CreateProductBody, ProductReturn } from "../dtos";
import { ProductErrors } from "../errors";
import { mapProductTaxonomy, productTaxonomyInclude, validateTaxonomy } from "./taxonomy";

export class CreateProduct {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, data: CreateProductBody): Promise<ProductReturn> {
		if (!companyId) throw new DomainError(ProductErrors.NO_COMPANY);
		const { categoryIds, tagIds, unitIds, ...fields } = data;
		await validateTaxonomy(this.prisma, companyId, categoryIds, tagIds);
		const selectedUnitIds =
			unitIds ??
			(
				await this.prisma.unit.findMany({
					select: { id: true },
					where: { companyId },
				})
			).map(unit => unit.id);
		if (unitIds) {
			const unitsCount = await this.prisma.unit.count({
				where: { companyId, id: { in: selectedUnitIds } },
			});
			if (unitsCount !== selectedUnitIds.length) throw new DomainError(ProductErrors.PRODUCT_NOT_FOUND);
		}
		try {
			const product = await this.prisma.product.create({
				data: {
					...fields,
					basePriceCents: fields.basePriceCents ?? 0,
					categories: {
						create: (categoryIds ?? []).map(categoryId => ({
							categoryId,
						})),
					},
					companyId,
					slug: slugify(data.title, "produto"),
					tags: { create: (tagIds ?? []).map(tagId => ({ tagId })) },
					unitProducts: {
						create: selectedUnitIds.map(unitId => ({ unitId })),
					},
				},
				include: productTaxonomyInclude,
			});
			return mapProductTaxonomy(product);
		} catch (error) {
			if (isUniqueProductSlugError(error)) throw new DomainError(ProductErrors.PRODUCT_ALREADY_EXISTS);
			throw error;
		}
	}
}

function isUniqueProductSlugError(error: unknown): boolean {
	if (typeof error !== "object" || error === null || !("code" in error) || !("meta" in error)) return false;
	const target = (error.meta as { target?: unknown }).target;
	return error.code === "P2002" && Array.isArray(target) && target.includes("companyId") && target.includes("slug");
}
