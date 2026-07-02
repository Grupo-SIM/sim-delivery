import { t } from "elysia";
import { CompanyPlain } from "sql/typebox";

/** Public shape of a company, reused across company endpoints. */
export const CompanyReturn = CompanyPlain;
export type CompanyReturn = typeof CompanyReturn.static;

export const CompanyListReturn = t.Array(CompanyReturn);
export type CompanyListReturn = typeof CompanyListReturn.static;
