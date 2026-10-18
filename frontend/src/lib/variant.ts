import { branding } from "./branding";

/** Company selected at build time; VITE_COMPANY_SLUG remains a local development fallback. */
export const slug = branding.companySlug || import.meta.env.VITE_COMPANY_SLUG;
