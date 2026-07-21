import { t } from "elysia";

export const CreateReviewBody = t.Object({
	comment: t.Optional(t.String({ maxLength: 500 })),
	orderId: t.String(),
	rating: t.Integer({ maximum: 5, minimum: 1 }),
	slug: t.String(),
});
export type CreateReviewBody = typeof CreateReviewBody.static;

export const ListReviewsQuery = t.Object({
	unitId: t.Optional(t.String()),
});
export type ListReviewsQuery = typeof ListReviewsQuery.static;

export const CreateReviewDTO = t.Object({
	...CreateReviewBody.properties,
	companyId: t.Nullable(t.String()),
	customerId: t.String(),
});
export type CreateReviewDTO = typeof CreateReviewDTO.static;
