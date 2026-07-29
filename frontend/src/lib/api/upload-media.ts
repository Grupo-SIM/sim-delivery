import { type PostMediaByAssetPathParamsAssetEnumKey, postMediaByAsset } from "./generated/api";

export type MediaAsset = PostMediaByAssetPathParamsAssetEnumKey;

export async function uploadMedia(asset: MediaAsset, file: File): Promise<string> {
	return (await postMediaByAsset(asset, { file })).url;
}
