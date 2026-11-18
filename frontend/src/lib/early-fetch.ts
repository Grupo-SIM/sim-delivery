/** Requests started by the inline script in index.html (src/lib/early-preload.ts), keyed by absolute URL. */
type EarlyStore = Map<string, Promise<Response | undefined>>;

/** Returns the early response for this request once, so a retry or later refetch hits the network. */
export function takeEarlyResponse(url: string): Promise<Response | undefined> | undefined {
	if (typeof window === "undefined") return;

	const store = (window as unknown as { __earlyFetch?: EarlyStore }).__earlyFetch;
	const pending = store?.get(url);
	store?.delete(url);
	return pending;
}
