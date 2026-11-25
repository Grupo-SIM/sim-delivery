export type EarlyImage = { sizes: string; widths: number[] };

export type EarlyPreloadConfig = {
	apiUrl: string;
	banner: EarlyImage;
	cdnUrl?: string;
	companySlug?: string;
	product: EarlyImage;
	/** Top-level paths that are not unit slugs (orders, profile, admin...). */
	reservedPaths: string[];
};

/**
 * Runs inline in `<head>` (serialized by the Vite plugin), before any bundle loads. On storefront entry points
 * (`/` and `/<unit>`) it starts the units and menu requests immediately and preloads the LCP candidates with
 * high priority as soon as they are known: the first banner and, for `?product=` links, the product photo.
 * Without it the `<img>` is only discovered after JS + API + render.
 * Must stay self-contained: no imports or outer references. Responses are parked in `window.__earlyFetch`
 * and consumed once by `takeEarlyResponse` (src/lib/early-fetch.ts).
 */
export function earlyPreload(config: EarlyPreloadConfig) {
	const segments = location.pathname.split("/").filter(Boolean).map(decodeURIComponent);
	if (segments.length > 1 || (segments[0] && config.reservedPaths.includes(segments[0]))) return;

	const search = new URLSearchParams(location.search);
	const productId = search.get("product");
	const menuOnly = search.get("menuOnly") === "true";

	const store = new Map<string, Promise<Response | undefined>>();
	(window as unknown as { __earlyFetch: typeof store }).__earlyFetch = store;

	const headers: Record<string, string> = {};
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	if (timeZone) headers["X-Time-Zone"] = timeZone;
	const query = config.companySlug ? `?${new URLSearchParams({ slug: config.companySlug })}` : "";

	const request = (path: string) => {
		const url = `${config.apiUrl.replace(/\/+$/, "")}${path}${query}`;
		const pending = fetch(url, { credentials: "include", headers }).catch(() => undefined);
		store.set(url, pending);
		return pending;
	};

	const json = async <T>(response: Response | undefined): Promise<T | undefined> =>
		response?.ok ? ((await response.clone().json()) as T) : undefined;

	const preload = (imageUrl: string | null | undefined, image: EarlyImage) => {
		if (!imageUrl) return;

		const link = document.createElement("link");
		link.rel = "preload";
		link.as = "image";
		link.href = imageUrl;
		link.setAttribute("fetchpriority", "high");
		if (config.cdnUrl && imageUrl.startsWith(`${config.cdnUrl}/`)) {
			const filename = imageUrl.split("?")[0].split("/").pop();
			const mediaUrl = `${config.apiUrl.replace(/\/+$/, "")}/media/${filename}`;
			link.setAttribute("imagesrcset", image.widths.map(width => `${mediaUrl}?width=${width} ${width}w`).join(", "));
			link.setAttribute("imagesizes", image.sizes);
		}
		document.head.append(link);
	};

	const loadMenu = (unitSlug: string) =>
		request(`/public/units/${unitSlug}/menu`).then(async response => {
			const sections = await json<{ items: { id: string; imageUrl?: string | null }[] }[]>(response);
			if (productId) preload(sections?.flatMap(section => section.items).find(item => item.id === productId)?.imageUrl, config.product);
		});

	const units = request("/public/units").then(json<{ bannerUrls: string[]; slug: string }[]>);
	const loadBanner = (unitSlug?: string) =>
		units.then(list => {
			const unit = unitSlug ? list?.find(each => each.slug === unitSlug) : list?.length === 1 ? list[0] : undefined;
			if (!menuOnly) preload(unit?.bannerUrls[0], config.banner);
			return unit?.slug;
		});

	if (segments[0]) {
		void loadMenu(segments[0]);
		void loadBanner(segments[0]);
		return;
	}

	// Homepage of a single-unit company: the unit slug is only known after the units list.
	void loadBanner().then(unitSlug => {
		if (unitSlug) void loadMenu(unitSlug);
	});
}
