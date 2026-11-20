import { redirect } from "@tanstack/react-router";
import { buildUtmSearch, utmNetworks } from "./utm-networks";
import { captureUtm } from "./utm";

/** Redirects to the home with the network's fixed UTMs plus every extra param received (fbclid, gclid...). */
export function redirectToTrackedHome(network: string, incoming: Record<string, unknown>) {
	const preset = utmNetworks[network.toLowerCase()];
	const search = new URLSearchParams(preset ? buildUtmSearch(preset, incoming) : (incoming as Record<string, string>)).toString();
	// The first-load capture only saw the short URL; capture the final one too.
	captureUtm(`?${search}`);
	throw redirect({ href: `/${search ? `?${search}` : ""}`, replace: true });
}
