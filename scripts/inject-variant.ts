/**
 * Injects a whitelabel variant into the frontend build by:
 * 1. Writing VITE_COMPANY_SLUG (and optionally VITE_API_URL/VITE_APP_URL) to
 *    frontend/.env.local
 * 2. Copying frontend/variants/<key>/ assets into frontend/public/ (if present)
 * 3. Patching src-tauri/tauri.conf.json with the variant's productName and identifier
 *
 * Usage:  bun scripts/inject-variant.ts --slug=demo-acai
 *         bun scripts/inject-variant.ts --slug=default
 */

import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const FRONTEND = join(ROOT, "frontend");
const SCRIPTS_DIR = join(ROOT, "scripts");

// --- parse --slug=xxx argument ---
const slugArg = process.argv.find(a => a.startsWith("--slug="));
if (!slugArg) {
	console.error("Usage: bun scripts/inject-variant.ts --slug=<company-slug>");
	process.exit(1);
}
const slug = slugArg.slice("--slug=".length);

// --- load variants.json ---
interface Variant {
	slug: string;
	appName: string;
	bundleIdentifier: string;
	description?: string;
	apiUrl?: string;
	appUrl?: string;
}

const variantsPath = join(FRONTEND, "variants.json");
const variants: Variant[] = JSON.parse(await readFile(variantsPath, "utf8"));
const variant = variants.find(v => v.slug === slug);
if (!variant) {
	console.error(`Company slug "${slug}" not found in frontend/variants.json`);
	console.error("Available slugs:", variants.map(v => v.slug).join(", "));
	process.exit(1);
}

console.log(`Injecting variant: ${variant.slug} (${variant.appName})`);

// --- 1. Write frontend/.env.local ---
const envLines: string[] = [];
if (slug !== "default") {
	envLines.push(`VITE_COMPANY_SLUG=${slug}`);
} else {
	envLines.push("# VITE_COMPANY_SLUG= (unset — serves all companies)");
}
if (variant.apiUrl) envLines.push(`VITE_API_URL=${variant.apiUrl}`);
if (variant.appUrl) envLines.push(`VITE_APP_URL=${variant.appUrl}`);

const envPath = join(FRONTEND, ".env.local");
await writeFile(envPath, `${envLines.join("\n")}\n`);
console.log("  ✓ Wrote frontend/.env.local");

// --- 2. Copy variant assets (if present) ---
const assetsDir = join(FRONTEND, "variants", slug);
if (existsSync(assetsDir)) {
	const publicDir = join(FRONTEND, "public");
	await mkdir(publicDir, { recursive: true });
	const files = await readdir(assetsDir);
	for (const file of files) {
		await copyFile(join(assetsDir, file), join(publicDir, file));
	}
	console.log(`  ✓ Copied ${files.length} asset(s) from variants/${slug}/`);
} else {
	console.log(`  — No variant assets dir at frontend/variants/${slug}/`);
}

// --- 3. Patch tauri.conf.json ---
const tauriConfPath = join(FRONTEND, "src-tauri", "tauri.conf.json");
if (existsSync(tauriConfPath)) {
	const conf = JSON.parse(await readFile(tauriConfPath, "utf8"));
	conf.productName = variant.appName;
	conf.identifier = variant.bundleIdentifier;
	if (conf.app?.windows?.[0]) {
		conf.app.windows[0].title = variant.appName;
	}
	await writeFile(tauriConfPath, `${JSON.stringify(conf, null, "\t")}\n`);
	console.log("  ✓ Patched src-tauri/tauri.conf.json");
}

console.log(`Done — ${variant.appName} variant active.`);
