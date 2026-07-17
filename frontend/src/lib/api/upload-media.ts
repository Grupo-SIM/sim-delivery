import ky from "ky";
import { branding } from "@/lib/branding";

export type MediaAsset = "banner" | "font-display" | "font-family" | "logo" | "product" | "promotion" | "unit";

export async function uploadMedia(asset: MediaAsset, file: File): Promise<string> {
	const data = new FormData();
	data.set("file", file);

	return ky
		.post(`${branding.apiUrl}/media/${asset}`, { body: data, credentials: "include" })
		.json<{ url: string }>()
		.then(response => response.url);
}
