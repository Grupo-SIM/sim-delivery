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

const mediaFilenamePattern =
	/^\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:avif|jpg|otf|pdf|png|ttf|webp|woff|woff2))$/;

export async function deleteMedia(asset: MediaAsset, url: string): Promise<void> {
	let mediaUrl: URL;
	try {
		mediaUrl = new URL(url);
	} catch {
		return;
	}
	if (mediaUrl.origin !== new URL(branding.apiUrl).origin) return;

	const filename = mediaUrl.pathname.match(mediaFilenamePattern)?.[1];
	if (!filename) return;

	await ky.delete(`${branding.apiUrl}/media/${asset}/${filename}`, {
		credentials: "include",
		timeout: false,
	});
}
