import ky from "ky";
import { branding } from "@/lib/branding";
import type { PostMediaByAssetPathParamsAssetEnumKey } from "./generated/api";

export type MediaAsset = PostMediaByAssetPathParamsAssetEnumKey;

export async function uploadMedia(asset: MediaAsset, file: File): Promise<string> {
	const body = new FormData();
	body.set("file", file, file.name);

	return (
		await ky
			.post(`${branding.apiUrl}/media/${asset}`, {
				body,
				credentials: "include",
				timeout: false,
			})
			.json<{ url: string }>()
	).url;
}
