import { t } from "elysia";
import { __nullable__ } from "sql/typebox";

export const BrandingReturn = t.Object({
	footerText: __nullable__(t.String()),
	logoUrl: __nullable__(t.String()),
	primaryColor: __nullable__(t.String()),
});
export type BrandingReturn = typeof BrandingReturn.static;
