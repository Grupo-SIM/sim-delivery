import { redirect } from "@tanstack/react-router";
import { buildUtmSearch, utmNetworks } from "./utm-networks";
import { captureUtm } from "./utm";

/** Redirects to the home (or to `unitSlug`'s page, for multi-unit companies) with the network's fixed UTMs plus every extra param received (fbclid, gclid...). */
export function redirectToTrackedHome(network: string, incoming: Record<string, unknown>, unitSlug?: string) {
	const preset = utmNetworks[network.toLowerCase()];
	const search = new URLSearchParams(preset ? buildUtmSearch(preset, incoming) : (incoming as Record<string, string>)).toString();
	// The first-load capture only saw the short URL; capture the final one too.
	captureUtm(`?${search}`);
	throw redirect({ href: `/${unitSlug ? encodeURIComponent(unitSlug) : ""}${search ? `?${search}` : ""}`, replace: true });
}
