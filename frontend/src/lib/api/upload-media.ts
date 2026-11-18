import ky from "ky";
import { branding } from "@/lib/branding";
import { isCdnMediaUrl } from "@/lib/media-url";
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

const mediaFilePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:avif|jpg|otf|pdf|png|ttf|webp|woff|woff2)$/;

function mediaFilename(url: string): string | undefined {
	let mediaUrl: URL;
	try {
		mediaUrl = new URL(url);
	} catch {
		return;
	}

	if (isCdnMediaUrl(url)) {
		const filename = mediaUrl.pathname.split("/").pop();
		return filename && mediaFilePattern.test(filename) ? filename : undefined;
	}
	if (mediaUrl.origin !== new URL(branding.apiUrl).origin) return;

	return mediaUrl.pathname.match(mediaFilenamePattern)?.[1];
}

export async function deleteMedia(asset: MediaAsset, url: string): Promise<void> {
	const filename = mediaFilename(url);
	if (!filename) return;

	await ky.delete(`${branding.apiUrl}/media/${asset}/${filename}`, {
		credentials: "include",
		timeout: false,
	});
}
