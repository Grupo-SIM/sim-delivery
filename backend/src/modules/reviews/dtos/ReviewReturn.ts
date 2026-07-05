import { t } from "elysia";
import { __nullable__ } from "sql/typebox";

export const ReviewReturn = t.Object({
	comment: __nullable__(t.String()),
	companyId: t.String(),
	createdAt: t.Date(),
	customerId: t.String(),
	customerName: t.String(),
	id: t.String(),
	orderId: t.String(),
	rating: t.Integer(),
	updatedAt: t.Date(),
});
export type ReviewReturn = typeof ReviewReturn.static;

export const ReviewListReturn = t.Array(ReviewReturn);
export type ReviewListReturn = typeof ReviewListReturn.static;
