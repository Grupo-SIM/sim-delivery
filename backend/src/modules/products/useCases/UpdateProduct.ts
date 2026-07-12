import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { ProductReturn, UpdateProductBody } from "../dtos";
import { ProductErrors } from "../errors";

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
		if (!product) {
			throw new DomainError(ProductErrors.PRODUCT_NOT_FOUND);
		}

		return this.prisma.product.update({ data, where: { id: productId } });
	}
}
