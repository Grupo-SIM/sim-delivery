/**
 * Shared by the rendered `<img>` elements and the early preload in index.html (src/lib/early-preload.ts).
 * Widths and sizes must match or the browser downloads each image twice.
 */
export const PRODUCT_IMAGE_WIDTHS = [400, 800, 1200];
export const PRODUCT_IMAGE_SIZES = "(min-width: 1024px) 400px, 100vw";
export const BANNER_IMAGE_WIDTHS = [480, 640, 768, 1024, 1280, 1600];
export const BANNER_IMAGE_SIZES = "(min-width: 1024px) 1024px, 100vw";
