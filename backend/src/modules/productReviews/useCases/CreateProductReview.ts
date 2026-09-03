import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CreateProductReviewDTO, ProductReviewReturn } from "../dtos";
import { ProductReviewErrors } from "../errors";

const ELIGIBLE_STATUSES = new Set(["entregue", "retirado"]);

export class CreateProductReview {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({
		companyId,
		comment,
		customerId,
		orderId,
		productId,
		rating,
	}: CreateProductReviewDTO): Promise<ProductReviewReturn> {
		if (!companyId) throw new DomainError(ProductReviewErrors.ORDER_NOT_FOUND);
		if (rating < 1 || rating > 5) throw new DomainError(ProductReviewErrors.INVALID_RATING);

		const order = await this.prisma.order.findFirst({
			include: { items: { select: { productId: true } } },
			where: { companyId, customerId, id: orderId },
		});
		if (!order) throw new DomainError(ProductReviewErrors.ORDER_NOT_FOUND);
		if (!ELIGIBLE_STATUSES.has(order.status)) throw new DomainError(ProductReviewErrors.ORDER_NOT_ELIGIBLE);
		if (!order.items.some(item => item.productId === productId)) {
			throw new DomainError(ProductReviewErrors.PRODUCT_NOT_IN_ORDER);
		}

		const existing = await this.prisma.productReview.findUnique({
			where: { orderId_productId: { orderId, productId } },
		});
		if (existing) throw new DomainError(ProductReviewErrors.ALREADY_REVIEWED);

		let review;
		try {
			review = await this.prisma.productReview.create({
				data: { comment: comment ?? null, companyId, customerId, orderId, productId, rating },
				include: { customer: { include: { user: true } }, product: { select: { title: true } } },
			});
		} catch (error) {
			if (isDuplicateProductReviewError(error)) throw new DomainError(ProductReviewErrors.ALREADY_REVIEWED);
			throw error;
		}

		return {
			comment: review.comment,
			companyId: review.companyId,
			createdAt: review.createdAt,
			customerId: review.customerId,
			customerName: review.customer.user.name ?? "",
			id: review.id,
			orderId: review.orderId,
			productId: review.productId,
			productTitle: review.product.title,
			rating: review.rating,
			updatedAt: review.updatedAt,
		};
	}
}

function isDuplicateProductReviewError(error: unknown): boolean {
	if (typeof error !== "object" || error === null || !("code" in error)) return false;
	return error.code === "P2002";
}
