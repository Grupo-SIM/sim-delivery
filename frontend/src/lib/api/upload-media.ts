import ky from "ky";
import { branding } from "@/lib/branding";
import { slug } from "@/lib/variant";

export type MediaAsset =
	| "banner"
	| "font-display"
	| "font-family"
	| "logo"
	| "product"
	| "promotion"
	| "unit";

export async function uploadMedia(asset: MediaAsset, file: File): Promise<string> {
	const data = new FormData();
	data.set("file", file);

	return ky
		.post(`${branding.apiUrl}/media/${asset}`, {
			body: data,
			credentials: "include",
			headers: slug ? { "x-company-slug": slug } : undefined,
		})
		.json<{ url: string }>()
		.then(response => response.url);
}
