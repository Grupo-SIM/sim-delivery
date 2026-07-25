import Elysia from "elysia";
import { AuthGuard, CompanyScopeGuard } from "@/modules/users/guards";
import { DomainError } from "@/shared/errors";
import { prisma } from "@/shared/infra/sql";
import { CreateReviewBody, ListReviewsQuery, ReviewListReturn, ReviewReturn } from "../../dtos";
import { ReviewErrors } from "../../errors";
import { CreateReview, ListReviews } from "../../useCases";

const createReview = new CreateReview(prisma);
const listReviews = new ListReviews(prisma);

export const ReviewsController = new Elysia({ prefix: "/reviews" })
	.get(
		"/",
		async ({ request }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "reviews", "read");
			return listReviews.execute(scope.companyId, {});
		},
		{ query: ListReviewsQuery, response: ReviewListReturn },
	)
	.post(
		"/",
		async ({ body, request }) => {
			const { userId } = await AuthGuard.execute(request.headers);

			const company = await prisma.company.findUnique({ where: { slug: body.slug } });
			if (!company) throw new DomainError(ReviewErrors.ORDER_NOT_FOUND);

			const customer = await prisma.customer.findFirst({
				where: { companyId: company.id, userId },
			});
			if (!customer) throw new DomainError(ReviewErrors.ORDER_NOT_FOUND);

			return createReview.execute({ ...body, companyId: company.id, customerId: customer.id });
		},
		{ body: CreateReviewBody, response: ReviewReturn },
	);
