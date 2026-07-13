import type { GetPublicUnits200 } from "@/lib/api";

export type PublicUnit = GetPublicUnits200[number];

export interface StorefrontBranding {
	companyName?: string | null;
	footerText?: string | null;
	logoUrl?: string | null;
}
