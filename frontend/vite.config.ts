import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import "dotenv/config";
import { branding } from "./src/lib/branding";

const host = process.env.TAURI_DEV_HOST;

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
	plugins: [tanstackRouter({ autoCodeSplitting: true, routeFileIgnorePattern: "^components$" }), react(), svgr()],
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
