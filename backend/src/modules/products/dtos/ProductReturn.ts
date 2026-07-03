import { t } from "elysia";
import { ProductPlain } from "sql/typebox";

export const ProductReturn = ProductPlain;
export type ProductReturn = typeof ProductReturn.static;

export const ProductListReturn = t.Array(ProductReturn);
export type ProductListReturn = typeof ProductListReturn.static;
