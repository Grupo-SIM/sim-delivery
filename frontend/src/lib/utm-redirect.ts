import { redirect } from "@tanstack/react-router";
import { getMarketingUtmLinksResolve } from "./api";
import { captureUtm } from "./utm";
import { buildUtmSearch } from "./utm-search";
import { slug } from "./variant";

/**
 * `/utm/<path>`: asks the backend for the link registered under `path` and redirects to the home (or the
 * link's unit) with its fixed UTMs plus every extra param received (fbclid, gclid...). An unknown path just
 * goes home with the params it came with.
 */
export async function redirectToTrackedLink(path: string, incoming: Record<string, unknown>): Promise<never> {
	const link = await getMarketingUtmLinksResolve({ path, slug }).catch(() => null);
	const search = new URLSearchParams(link ? buildUtmSearch(link, incoming) : (incoming as Record<string, string>)).toString();
	// The first-load capture only saw the short URL; capture the final one too.
	captureUtm(`?${search}`);
	throw redirect({ href: `/${link?.unitSlug ? encodeURIComponent(link.unitSlug) : ""}${search ? `?${search}` : ""}`, replace: true });
}
