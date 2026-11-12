import { t } from "elysia";
import { DiscountPlain } from "sql/typebox";

export const DiscountReturn = t.Object({ ...DiscountPlain.properties });
export type DiscountReturn = typeof DiscountReturn.static;

export const DiscountListReturn = t.Array(DiscountReturn);
export type DiscountListReturn = typeof DiscountListReturn.static;
