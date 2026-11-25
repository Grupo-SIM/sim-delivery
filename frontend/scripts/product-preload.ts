import { PRODUCT_IMAGE_SIZES, PRODUCT_IMAGE_WIDTHS } from "../src/lib/early-images";

const nginxQuote = (value: string) => `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;

/**
 * `<link rel="preload">` for a product photo, same URLs/sizes as the `<img>` and as `earlyPreload`, so the
 * browser fetches the exact responsive candidate once. Null for images that are not CDN-hosted.
 */
export function productPreloadLink(imageUrl: string, apiUrl: string, cdnUrl?: string): string | null {
	if (!cdnUrl || !imageUrl.startsWith(`${cdnUrl}/`)) return null;
	const filename = imageUrl.split("?")[0].split("/").pop();
	if (!filename || !/^[\w.-]+$/.test(filename)) return null;
	const mediaUrl = `${apiUrl.replace(/\/+$/, "")}/media/${filename}`;
	const srcset = PRODUCT_IMAGE_WIDTHS.map(width => `${mediaUrl}?width=${width} ${width}w`).join(", ");
	return `<link id="product-preload" rel="preload" as="image" fetchpriority="high" imagesrcset="${srcset}" imagesizes="${PRODUCT_IMAGE_SIZES}" href="${mediaUrl}?width=${PRODUCT_IMAGE_WIDTHS[0]}" />`;
}

/**
 * nginx `map` of `?product=<id>` to its preload tag. `sub_filter` injects it into the very first bytes of the HTML,
 * so the photo is requested before any JS runs or the API answers. Unknown ids map to nothing.
 */
export function productPreloadNginxMap(products: { id: string; imageUrl: string }[], apiUrl: string, cdnUrl?: string): string {
	const entries = products.flatMap(({ id, imageUrl }) => {
		const link = /^[\w-]+$/.test(id) ? productPreloadLink(imageUrl, apiUrl, cdnUrl) : null;
		return link ? [`\t${nginxQuote(id)} ${nginxQuote(link)};`] : [];
	});
	return `map $arg_product $product_preload {\n\tdefault "";\n${entries.join("\n")}\n}\n`;
}
