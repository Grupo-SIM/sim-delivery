import { t } from "elysia";

export const CreateReviewBody = t.Object({
	comment: t.Optional(t.String({ maxLength: 500 })),
	orderId: t.String(),
	rating: t.Integer({ minimum: 1, maximum: 5 }),
});
export type CreateReviewBody = typeof CreateReviewBody.static;

export const ListReviewsQuery = t.Object({
	unitId: t.Optional(t.String()),
});
export type ListReviewsQuery = typeof ListReviewsQuery.static;

export const CreateReviewDTO = t.Object({
	...CreateReviewBody.properties,
	customerId: t.String(),
	companyId: t.Nullable(t.String()),
});
export type CreateReviewDTO = typeof CreateReviewDTO.static;
