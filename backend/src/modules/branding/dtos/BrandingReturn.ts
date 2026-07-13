import { t } from "elysia";
import { __nullable__ } from "sql/typebox";
import { ThemeColors } from "./BrandingInput";

export const BrandingReturn = t.Object({
	companyName: __nullable__(t.String()),
	footerText: __nullable__(t.String()),
	ga4Id: __nullable__(t.String()),
	gtmId: __nullable__(t.String()),
	logoUrl: __nullable__(t.String()),
	metaPixelId: __nullable__(t.String()),
	primaryColor: __nullable__(t.String()),
	themeColors: __nullable__(ThemeColors),
});
export type BrandingReturn = typeof BrandingReturn.static;
