import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ProductErrors } from "../errors";

export class DeleteProduct {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, productId: string): Promise<void> {
		const product = companyId
			? await this.prisma.product.findFirst({ where: { companyId, id: productId } })
			: null;
		if (!product) {
			throw new DomainError(ProductErrors.PRODUCT_NOT_FOUND);
		}

		await this.prisma.product.delete({ where: { id: productId } });
	}
}
