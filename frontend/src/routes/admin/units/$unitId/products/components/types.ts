import type { GetCategories200, GetProducts200, GetTags200, GetUnitsByUnitIdProducts200 } from "@/lib/api";

export type UnitProduct = GetUnitsByUnitIdProducts200[number];
export type Product = GetProducts200[number];
export type Category = GetCategories200[number];
export type Tag = GetTags200[number];

export const money = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });
