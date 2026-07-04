import { t } from "elysia";

export const GetLoyaltyQuery = t.Object({
	variantKey: t.String({ minLength: 1 }),
});
export type GetLoyaltyQuery = typeof GetLoyaltyQuery.static;

export const LoyaltyBalanceReturn = t.Object({
	balancePoints: t.Integer(),
});
export type LoyaltyBalanceReturn = typeof LoyaltyBalanceReturn.static;
