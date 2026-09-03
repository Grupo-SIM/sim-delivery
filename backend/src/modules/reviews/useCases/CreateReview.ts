import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CreateReviewDTO, ReviewReturn } from "../dtos";
import { ReviewErrors } from "../errors";

const ELIGIBLE_STATUSES = new Set(["entregue", "retirado"]);

export class CreateReview {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({ companyId, comment, customerId, orderId, rating }: CreateReviewDTO): Promise<ReviewReturn> {
		if (!companyId) throw new DomainError(ReviewErrors.ORDER_NOT_FOUND);
		if (rating < 1 || rating > 5) throw new DomainError(ReviewErrors.INVALID_RATING);

		const order = await this.prisma.order.findFirst({
			where: { companyId, customerId, id: orderId },
		});
		if (!order) throw new DomainError(ReviewErrors.ORDER_NOT_FOUND);
		if (!ELIGIBLE_STATUSES.has(order.status)) throw new DomainError(ReviewErrors.ORDER_NOT_ELIGIBLE);

		const existing = await this.prisma.review.findUnique({ where: { orderId } });
		if (existing) throw new DomainError(ReviewErrors.ALREADY_REVIEWED);

		let review;
		try {
			review = await this.prisma.review.create({
				data: { comment: comment ?? null, companyId, customerId, orderId, rating },
				include: { customer: { include: { user: true } } },
			});
		} catch (error) {
			if (isDuplicateReviewError(error)) throw new DomainError(ReviewErrors.ALREADY_REVIEWED);
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
			rating: review.rating,
			updatedAt: review.updatedAt,
		};
	}
}

function isDuplicateReviewError(error: unknown): boolean {
	if (typeof error !== "object" || error === null || !("code" in error)) return false;
	return error.code === "P2002";
}
