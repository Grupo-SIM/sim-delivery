type FetchImplementation = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const retryDelayMs = 150;

function isSessionRead(input: string | URL | Request, init?: RequestInit): boolean {
	const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
	if (method !== "GET") return false;

	const rawUrl = input instanceof Request ? input.url : String(input);
	const baseUrl = globalThis.location?.origin ?? "http://localhost";
	return new URL(rawUrl, baseUrl).pathname.endsWith("/auth/get-session");
}

function wait(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/** Retries one idempotent session read after a transient transport/server failure. */
export function createAuthFetch(fetchImplementation: FetchImplementation): FetchImplementation {
	return async (input, init) => {
		if (!isSessionRead(input, init)) return fetchImplementation(input, init);

		try {
			const response = await fetchImplementation(input, init);
			if (response.status < 500) return response;
			await response.body?.cancel();
		} catch {
			// A dropped database socket may surface as a failed HTTP request instead of a 5xx.
		}

		await wait(retryDelayMs);
		return fetchImplementation(input, init);
	};
}
