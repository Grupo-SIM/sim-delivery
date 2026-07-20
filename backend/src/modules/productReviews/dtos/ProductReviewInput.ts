import { t } from "elysia";

export const CreateProductReviewBody = t.Object({
	comment: t.Optional(t.String({ maxLength: 500 })),
	orderId: t.String(),
	productId: t.String(),
	rating: t.Integer({ maximum: 5, minimum: 1 }),
	slug: t.String(),
});
export type CreateProductReviewBody = typeof CreateProductReviewBody.static;

export const ListProductReviewsQuery = t.Object({
	productId: t.Optional(t.String()),
});
export type ListProductReviewsQuery = typeof ListProductReviewsQuery.static;

export const CreateProductReviewDTO = t.Object({
	...CreateProductReviewBody.properties,
	companyId: t.Nullable(t.String()),
	customerId: t.String(),
});
export type CreateProductReviewDTO = typeof CreateProductReviewDTO.static;
