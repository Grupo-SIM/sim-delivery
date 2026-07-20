import type { PrismaInstance } from "@/shared/infra/sql";
import type { ListProductReviewsQuery, ProductReviewListReturn } from "../dtos";

export class ListProductReviews {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, query: ListProductReviewsQuery): Promise<ProductReviewListReturn> {
		const { productId } = query;

		const reviews = await this.prisma.productReview.findMany({
			include: { customer: { include: { user: true } }, product: { select: { title: true } } },
			orderBy: { createdAt: "desc" },
			where: {
				...(companyId ? { companyId } : {}),
				...(productId ? { productId } : {}),
			},
		});

		return reviews.map(r => ({
			comment: r.comment,
			companyId: r.companyId,
			createdAt: r.createdAt,
			customerId: r.customerId,
			customerName: r.customer.user.name ?? "",
			id: r.id,
			orderId: r.orderId,
			productId: r.productId,
			productTitle: r.product.title,
			rating: r.rating,
			updatedAt: r.updatedAt,
		}));
	}
}
