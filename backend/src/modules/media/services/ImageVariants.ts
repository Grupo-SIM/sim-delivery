import sharp from "sharp";

/** Variant widths served by `GET /media/:filename?width=N`; requests snap up to the next bucket to bound storage. */
export const VARIANT_WIDTHS = [96, 144, 192, 288, 400, 480, 640, 800, 1024, 1280, 1600] as const;

/** Raster formats the optimizer can resize; others (fonts, PDFs) are always served untouched. */
export const OPTIMIZABLE_EXTENSIONS = ["avif", "jpg", "png", "webp"];

/** Assets whose exact bytes matter (PWA icons, logo used in emails) and are never re-encoded on upload. */
export const UNTOUCHED_ASSETS = ["logo", "mobile-icon", "whatsapp"];

export const MAX_ORIGINAL_WIDTH = 1600;

export function snapVariantWidth(width: number): number {
	return VARIANT_WIDTHS.find(bucket => bucket >= width) ?? VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1];
}

export function variantFilename(filename: string, width: number): string {
	return `${filename.replace(/\.[^.]+$/, "")}-w${width}.webp`;
}

export function variantFilenames(filename: string): string[] {
	return VARIANT_WIDTHS.map(width => variantFilename(filename, width));
}

/** Re-encodes an upload as WebP capped at `MAX_ORIGINAL_WIDTH`, auto-rotated, metadata stripped. */
export async function optimizeOriginal(input: Uint8Array): Promise<Uint8Array> {
	return new Uint8Array(
		await sharp(input)
			.rotate()
			.resize({ width: MAX_ORIGINAL_WIDTH, withoutEnlargement: true })
			.webp({ quality: 82 })
			.toBuffer(),
	);
}

export async function resizeToWebp(input: Uint8Array, width: number): Promise<Uint8Array> {
	return new Uint8Array(
		await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer(),
	);
}
