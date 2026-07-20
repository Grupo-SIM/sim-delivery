import Elysia, { t } from "elysia";
import { prisma } from "@/shared/infra/sql";
import { ReviewListReturn } from "../../dtos";
import { ListReviews } from "../../useCases";

const listReviews = new ListReviews(prisma);

/** Customer-facing, unauthenticated store review listing (docs/02). */
export const PublicReviewsController = new Elysia({
	detail: {
		tags: ["Public"],
	},
}).group("/public", app =>
	app.get(
		"/reviews",
		async ({ query }) => {
			const company = query.slug ? await prisma.company.findUnique({ where: { slug: query.slug } }) : null;
			if (!company) return [];
			return listReviews.execute(company.id, { unitId: query.unitId });
		},
		{
			query: t.Object({ slug: t.Optional(t.String()), unitId: t.String() }),
			response: ReviewListReturn,
		},
	),
);
