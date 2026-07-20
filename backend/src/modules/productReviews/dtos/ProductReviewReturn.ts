import { t } from "elysia";
import { __nullable__ } from "sql/typebox";

export const ProductReviewReturn = t.Object({
	comment: __nullable__(t.String()),
	companyId: t.String(),
	createdAt: t.Date(),
	customerId: t.String(),
	customerName: t.String(),
	id: t.String(),
	orderId: t.String(),
	productId: t.String(),
	productTitle: t.String(),
	rating: t.Integer(),
	updatedAt: t.Date(),
});
export type ProductReviewReturn = typeof ProductReviewReturn.static;

export const ProductReviewListReturn = t.Array(ProductReviewReturn);
export type ProductReviewListReturn = typeof ProductReviewListReturn.static;

export const ProductRatingSummary = t.Object({
	ratingAverage: __nullable__(t.Number()),
	ratingCount: t.Integer(),
});
export type ProductRatingSummary = typeof ProductRatingSummary.static;
