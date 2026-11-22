import type { GetCompanies200, GetMarketingUtmLinks200 } from "@/lib/api";

export type UtmLink = GetMarketingUtmLinks200[number];
export type UtmCompany = GetCompanies200[number];

export type DestinationMode = "home" | "unit" | "url";
export interface DestinationState {
	mode: DestinationMode;
	unitSlug: string;
	url: string;
}
