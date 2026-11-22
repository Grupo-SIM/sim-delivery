import { redirect } from "@tanstack/react-router";
import { getMarketingUtmLinksResolve } from "./api";
import { captureUtm } from "./utm";
import { buildUtmSearch } from "./utm-search";

/**
 * `/utm/<path>`: asks the backend for the link registered under `path` and redirects to its URL (a storefront
 * "/path" or an absolute URL; empty = home) with its fixed UTMs plus every extra param received (fbclid,
 * gclid...). An unknown path just goes home with the params it came with.
 */
export async function redirectToTrackedLink(path: string, incoming: Record<string, unknown>): Promise<never> {
	const link = await getMarketingUtmLinksResolve({ path }).catch(() => null);
	const params = link ? buildUtmSearch(link, incoming) : (incoming as Record<string, string>);
	let target: URL;
	try {
		target = new URL(link?.url || "/", window.location.origin);
	} catch {
		target = new URL("/", window.location.origin);
	}
	for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value);
	if (target.origin !== window.location.origin) throw redirect({ href: target.toString(), replace: true });
	// The first-load capture only saw the short URL; capture the final one too.
	captureUtm(target.search);
	throw redirect({ href: `${target.pathname}${target.search}${target.hash}`, replace: true });
}
