import { t } from "elysia";

export const GetCashbackQuery = t.Object({
	variantKey: t.String({ minLength: 1 }),
});
export type GetCashbackQuery = typeof GetCashbackQuery.static;

export const CashbackBalanceReturn = t.Object({
	balanceCents: t.Integer(),
});
export type CashbackBalanceReturn = typeof CashbackBalanceReturn.static;
