export type EarlyPreloadConfig = {
	apiUrl: string;
	cdnUrl?: string;
	companySlug?: string;
	imageSizes: string;
	imageWidths: number[];
};

/**
 * Runs inline in `<head>` (serialized by the Vite plugin), before any bundle loads. For a direct product link
 * (`?product=`) it starts the menu request immediately and preloads the product photo with high priority as
 * soon as the menu answers, instead of waiting for JS + API + render to discover the `<img>`.
 * Must stay self-contained: no imports or outer references. Responses are parked in `window.__earlyFetch`
 * and consumed once by `takeEarlyResponse` (src/lib/early-fetch.ts).
 */
export function earlyPreload(config: EarlyPreloadConfig) {
	const productId = new URLSearchParams(location.search).get("product");
	if (!productId) return;

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

	const preload = async (response: Response | undefined) => {
		if (!response?.ok) return;
		const sections: { items: { id: string; imageUrl?: string | null }[] }[] = await response.clone().json();
		const imageUrl = sections.flatMap(section => section.items).find(item => item.id === productId)?.imageUrl;
		if (!imageUrl) return;

		const link = document.createElement("link");
		link.rel = "preload";
		link.as = "image";
		link.href = imageUrl;
		link.setAttribute("fetchpriority", "high");
		if (config.cdnUrl && imageUrl.startsWith(`${config.cdnUrl}/`)) {
			const base = imageUrl.split("?")[0];
			link.setAttribute("imagesrcset", config.imageWidths.map(width => `${base}?width=${width} ${width}w`).join(", "));
			link.setAttribute("imagesizes", config.imageSizes);
		}
		document.head.append(link);
	};

	const [unitSlug] = location.pathname.split("/").filter(Boolean).map(decodeURIComponent);
	if (unitSlug) {
		void request(`/public/units/${unitSlug}/menu`).then(preload);
		return;
	}

	// Homepage of a single-unit company: the unit slug is only known after the units list.
	void request("/public/units")
		.then(async response => {
			if (!response?.ok) return;
			const units: { slug: string }[] = await response.clone().json();
			if (units.length === 1) await request(`/public/units/${units[0].slug}/menu`).then(preload);
		});
}
