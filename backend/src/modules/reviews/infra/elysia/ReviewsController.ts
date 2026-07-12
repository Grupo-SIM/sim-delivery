import Elysia from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { prisma } from "@/shared/infra/sql";
import { CreateReviewBody, ListReviewsQuery, ReviewListReturn, ReviewReturn } from "../../dtos";
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
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "reviews", "create");

			const customer = await prisma.customer.findFirst({
				where: { companyId: scope.companyId ?? undefined, userId: scope.userId },
			});
			if (!customer) throw new Error("CUSTOMER_NOT_FOUND");

			return createReview.execute({ ...body, companyId: scope.companyId, customerId: customer.id });
		},
		{ body: CreateReviewBody, response: ReviewReturn },
	);
