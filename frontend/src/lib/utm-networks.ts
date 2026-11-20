/** Social networks with a short tracked link on the delivery domain: `/utm/<network>`. Add a row to add a network. */
export interface UtmPreset {
	campaign: string;
	content: string;
	medium: string;
	source: string;
}

export const utmNetworks: Record<string, UtmPreset> = {
	facebook: { campaign: "branding_facebook", content: "link_in_bio", medium: "social", source: "fb" },
	instagram: { campaign: "branding_instagram", content: "link_in_bio", medium: "social", source: "ig" },
	tiktok: { campaign: "branding_tiktok", content: "link_in_bio", medium: "social", source: "tiktok" },
	whatsapp: { campaign: "branding_whatsapp", content: "link_in_bio", medium: "social", source: "whatsapp" },
	x: { campaign: "branding_x", content: "link_in_bio", medium: "social", source: "x" },
	youtube: { campaign: "branding_youtube", content: "link_in_bio", medium: "social", source: "youtube" },
};

/**
 * Fixed UTMs go first and replace any incoming utm_* of the same key; every other incoming param
 * (fbclid, gclid, utm_term...) is preserved as-is.
 */
export function buildUtmSearch(preset: UtmPreset, incoming: Record<string, unknown>) {
	const fixed = { utm_campaign: preset.campaign, utm_content: preset.content, utm_medium: preset.medium, utm_source: preset.source };
	const extra = Object.entries(incoming).filter(([key]) => !(key in fixed));
	return { ...fixed, ...Object.fromEntries(extra) } as Record<string, string>;
}
