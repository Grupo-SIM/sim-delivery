import { createClient } from "@hyoretsu/kubb/client";
import ky from "ky";
import { branding } from "@/lib/branding";

export type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from "@hyoretsu/kubb/client";
export default createClient(
	ky.extend({
		baseUrl: branding.apiUrl,
		credentials: "include",
		timeout: false,
	}),
);
