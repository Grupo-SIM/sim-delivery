export interface UtmParams {
	campaign?: string | null;
	content?: string | null;
	medium?: string | null;
	source?: string | null;
}

/**
 * The link's UTMs go first and replace any incoming utm_* of the same key; every other incoming param
 * (fbclid, gclid, utm_term...) is preserved as-is.
 */
export function buildUtmSearch(link: UtmParams, incoming: Record<string, unknown>) {
	const entries: [string, string | null | undefined][] = [
		["utm_campaign", link.campaign],
		["utm_content", link.content],
		["utm_medium", link.medium],
		["utm_source", link.source],
	];
	const fixed = Object.fromEntries(entries.filter((entry): entry is [string, string] => Boolean(entry[1])));
	// An unset UTM on the link must not let an incoming one of the same key through.
	const reserved = ["utm_campaign", "utm_content", "utm_medium", "utm_source"];
	const extra = Object.entries(incoming).filter(([key]) => !reserved.includes(key));
	return { ...fixed, ...Object.fromEntries(extra) } as Record<string, string>;
}
