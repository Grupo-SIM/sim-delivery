import { DomainError } from "@/shared/errors";
import { UserErrors } from "@/modules/users/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { ListReviewsQuery, ReviewListReturn } from "../dtos";

export class ListReviews {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, query: ListReviewsQuery): Promise<ReviewListReturn> {
		if (!companyId) throw new DomainError(UserErrors.FORBIDDEN);
		const { unitId } = query;

		const reviews = await this.prisma.review.findMany({
			include: { customer: { include: { user: true } } },
			orderBy: { createdAt: "desc" },
			where: {
				companyId,
				...(unitId ? { order: { unitId } } : {}),
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
			rating: r.rating,
			updatedAt: r.updatedAt,
		}));
	}
}
