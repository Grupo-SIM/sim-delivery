import Elysia, { t } from "elysia";
import { prisma } from "@/shared/infra/sql";
import { ProductReviewListReturn } from "../../dtos";
import { ListProductReviews } from "../../useCases";

const listProductReviews = new ListProductReviews(prisma);

/** Customer-facing, unauthenticated product review listing (docs/02). */
export const PublicProductReviewsController = new Elysia({
	detail: {
		tags: ["Public"],
	},
}).group("/public", app =>
	app.get(
		"/product-reviews",
		async ({ query }) => {
			const company = query.slug ? await prisma.company.findUnique({ where: { slug: query.slug } }) : null;
			if (!company) return [];
			return listProductReviews.execute(company.id, { productId: query.productId });
		},
		{
			query: t.Object({ productId: t.String(), slug: t.Optional(t.String()) }),
			response: ProductReviewListReturn,
		},
	),
);
