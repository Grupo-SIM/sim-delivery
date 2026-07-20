import type { GetPublicUnits200 } from "@/lib/api";

export type PublicUnit = GetPublicUnits200[number];

export interface StorefrontBranding {
	companyName?: string | null;
	footerFacebookUrl?: string | null;
	footerInstagramUrl?: string | null;
	footerPaymentMethods?: string[];
	footerSupportEmail?: string | null;
	footerText?: string | null;
	footerWhatsApp?: string | null;
	logoUrl?: string | null;
}
