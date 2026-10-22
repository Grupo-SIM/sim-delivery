import sharp from "sharp";

// Native app stores need at most 1024px. Larger square sources can exceed
// the Tauri decoder's memory limit, especially when padding wide wordmarks.
const MAX_ICON_SIZE = 1024;

export async function squareIconSource(sourcePath: string, outputPath: string, extraPadding = 0): Promise<string> {
	const image = sharp(sourcePath);
	const { width, height } = await image.metadata();
	if (!width || !height) throw new Error("Branding icon source has no dimensions.");

	const paddingScale = 1 + extraPadding * 2;
	const size = Math.min(MAX_ICON_SIZE, Math.ceil(Math.max(width, height) * paddingScale));
	const contentSize = Math.max(1, Math.floor(size / paddingScale));
	const margin = size - contentSize;
	const background = { alpha: 0, b: 0, g: 0, r: 0 };
	await image
		.resize(contentSize, contentSize, { background, fit: "contain" })
		.extend({
			background,
			bottom: Math.ceil(margin / 2),
			left: Math.floor(margin / 2),
			right: Math.ceil(margin / 2),
			top: Math.floor(margin / 2),
		})
		.png()
		.toFile(outputPath);
	return outputPath;
}
