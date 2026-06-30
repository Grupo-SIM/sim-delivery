import { createClient } from "@hyoretsu/kubb/client";
import ky from "ky";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from "@hyoretsu/kubb/client";
export default createClient(
	ky.extend({
		baseUrl: apiUrl,
		credentials: "include",
		timeout: false,
	}),
);
