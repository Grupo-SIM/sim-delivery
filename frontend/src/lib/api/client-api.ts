import { createClient } from "@hyoretsu/kubb/client";
import ky from "ky";
import { buildBranding } from "@/lib/build-branding";

export type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from "@hyoretsu/kubb/client";
export default createClient(
	ky.extend({
		baseUrl: buildBranding.apiUrl,
		credentials: "include",
		timeout: false,
	}),
);
