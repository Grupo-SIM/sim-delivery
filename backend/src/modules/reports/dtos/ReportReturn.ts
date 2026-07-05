import { t } from "elysia";

export const RevenueSummaryReturn = t.Object({
	averageOrderValue: t.Integer(),
	orderCount: t.Integer(),
	totalRevenue: t.Integer(),
});
export type RevenueSummaryReturn = typeof RevenueSummaryReturn.static;

export const BestSellerItem = t.Object({
	productId: t.String(),
	productName: t.String(),
	totalQuantity: t.Integer(),
	totalRevenue: t.Integer(),
});
export type BestSellerItem = typeof BestSellerItem.static;

export const BestSellersReturn = t.Array(BestSellerItem);
export type BestSellersReturn = typeof BestSellersReturn.static;
