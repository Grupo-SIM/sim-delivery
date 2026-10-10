import apiClient, { type Client } from "./client-api";

/** Status polling must recover from stalled requests and bypass browser caches. */
export const paymentStatusClient: Client = (config, options) => apiClient(config, {
	...options,
	cache: "no-store",
	retry: 0,	signal: config.signal,
	timeout: 10_000,
});
