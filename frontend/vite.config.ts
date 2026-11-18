import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type Plugin } from "vite";
import svgr from "vite-plugin-svgr";
import "dotenv/config";
import { branding } from "./src/lib/branding";
import { BANNER_IMAGE_SIZES, BANNER_IMAGE_WIDTHS, PRODUCT_IMAGE_SIZES, PRODUCT_IMAGE_WIDTHS } from "./src/lib/early-images";
import { earlyPreload } from "./src/lib/early-preload";

const host = process.env.TAURI_DEV_HOST;

// Top-level route segments that are never unit slugs: real routes, plus the storefront pages that sit beside `$unitId`.
const reservedPaths = [...new Set([".", "_storefront"]
	.flatMap(dir => readdirSync(join("src/routes", dir), { withFileTypes: true }))
	.map(entry => entry.name.replace(/\.tsx?$/, ""))
	.filter(name => !name.startsWith("$") && !name.startsWith("_") && name !== "components" && name !== "index"))];

/** Inlines the small generated branding stylesheet so it stops being a separate render-blocking request. */
const inlineBrandingCss = (): Plugin => ({
	name: "inline-branding-css",
	transformIndexHtml: {
		handler: html => {
			const file = join("public", "branding.css");
			if (!existsSync(file)) return html;
			return html.replace(/<link[^>]*href="\/branding\.css"[^>]*>/, () => `<style>${readFileSync(file, "utf8")}</style>`);
		},
		order: "pre",
	},
});

const cdnUrl = process.env.VITE_CDN_URL?.replace(/\/+$/, "");

/**
 * Inlines, at the top of <head>, the early units/menu fetch and the banner/product photo preloads, and opens the
 * CDN connection while the API answers (images are fetched without CORS, so no `crossorigin` on the preconnect).
 */
const earlyProductPreload = (): Plugin => ({
	name: "early-product-preload",
	transformIndexHtml: () => [
		...(cdnUrl ? [{ attrs: { href: cdnUrl, rel: "preconnect" }, injectTo: "head-prepend" as const, tag: "link" }] : []),
		{
			children: `(${earlyPreload.toString()})(${JSON.stringify({
				apiUrl: branding.apiUrl,
				cdnUrl,
				companySlug: branding.companySlug || process.env.VITE_COMPANY_SLUG,
				banner: { sizes: BANNER_IMAGE_SIZES, widths: BANNER_IMAGE_WIDTHS },
				product: { sizes: PRODUCT_IMAGE_SIZES, widths: PRODUCT_IMAGE_WIDTHS },
				reservedPaths,
			}).replaceAll("<", "\\u003c")})`,
			injectTo: "head-prepend",
			tag: "script",
		},
	],
});

export default defineConfig({
	build: {
		rolldownOptions: {
			output: {
				// Stable vendor chunks: cached across deploys and fetched in parallel with the entry.
				codeSplitting: {
					groups: [
						{ name: "vendor-react", priority: 40, test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/ },
						{ name: "vendor-tanstack", priority: 30, test: /node_modules[\\/]@tanstack[\\/]/ },
						{ name: "vendor-i18n", priority: 20, test: /node_modules[\\/](?:i18next|i18next-browser-languagedetector|react-i18next)[\\/]/ },
						{ name: "vendor-ui", priority: 10, test: /node_modules[\\/](?:@radix-ui|@floating-ui|react-remove-scroll|aria-hidden)[\\/]/ },
					],
				},
			},
		},
		minify: process.env.TAURI_ENV_DEBUG ? false : "esbuild",
		sourcemap: !!process.env.TAURI_ENV_DEBUG,
		target: "es2022",
	},
	clearScreen: false,
	envPrefix: ["VITE_", "TAURI_"],
	plugins: [tanstackRouter({ autoCodeSplitting: true, routeFileIgnorePattern: "^components$" }), react(), svgr(), inlineBrandingCss(), earlyProductPreload()],
	resolve: {
		tsconfigPaths: true,
	},
	server: {
		allowedHosts: [process.env.VITE_APP_URL || branding.siteUrl]
			.filter(Boolean)
			.map(each => each.replace(/(^https?:\/\/|\/$)/, "")),
		hmr: host
			? {
					host,
					port: 5174,
					protocol: "ws",
				}
			: undefined,
		host: host || false,
		port: 5173,
		strictPort: true,
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
});
