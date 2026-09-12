import { createClient } from "@hyoretsu/kubb/client";
import ky from "ky";
import { branding } from "@/lib/branding";

export type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from "@hyoretsu/kubb/client";
export default createClient(
	ky.extend({
		baseUrl: branding.apiUrl,
		credentials: "include",
		hooks: {
			beforeRequest: [request => {
				if (typeof window === "undefined") return;

				const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
				if (timeZone) request.headers.set("X-Time-Zone", timeZone);
			}],
		},
		timeout: false,
	}),
);
