import Elysia from "elysia";
import { AuthGuard, CompanyScopeGuard } from "@/modules/users/guards";
import { prisma } from "@/shared/infra/sql";
import { DomainError } from "@/shared/errors";
import { CreateProductReviewBody, ListProductReviewsQuery, ProductReviewListReturn, ProductReviewReturn } from "../../dtos";
import { ProductReviewErrors } from "../../errors";
import { CreateProductReview, ListProductReviews } from "../../useCases";

const createProductReview = new CreateProductReview(prisma);
const listProductReviews = new ListProductReviews(prisma);

export const ProductReviewsController = new Elysia({ prefix: "/product-reviews" })
	.get(
		"/",
		async ({ query, request }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "reviews", "read");
			return listProductReviews.execute(scope.companyId, query);
		},
		{ query: ListProductReviewsQuery, response: ProductReviewListReturn },
	)
	.post(
		"/",
		async ({ body, request }) => {
			const { userId } = await AuthGuard.execute(request.headers);

			const company = await prisma.company.findUnique({ where: { slug: body.slug } });
			if (!company) throw new DomainError(ProductReviewErrors.ORDER_NOT_FOUND);

			const customer = await prisma.customer.findFirst({
				where: { companyId: company.id, userId },
			});
			if (!customer) throw new DomainError(ProductReviewErrors.ORDER_NOT_FOUND);

			return createProductReview.execute({ ...body, companyId: company.id, customerId: customer.id });
		},
		{ body: CreateProductReviewBody, response: ProductReviewReturn },
	);
