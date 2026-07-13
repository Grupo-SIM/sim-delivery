/**
 * Injects a whitelabel variant into the frontend build by:
 * 1. Writing VITE_COMPANY_SLUG (and optionally VITE_API_URL/VITE_APP_URL) to
 *    frontend/.env.local
 * 2. Copying frontend/variants/<key>/ assets into frontend/public/ (if present) —
 *    this is what bakes in favicon.svg/apple-touch-icon.png for the web build
 * 3. Patching src-tauri/tauri.conf.json with the variant's productName and identifier
 * 4. Regenerating src-tauri/icons/ (Android/iOS/desktop app-store icons) from the
 *    variant's icon.png, since store icons are bundled at build time, not fetched at runtime
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

interface Branding {
	companyName: string | null;
	footerText: string | null;
	ga4Id: string | null;
	gtmId: string | null;
	logoUrl: string | null;
	metaPixelId: string | null;
	primaryColor: string | null;
	themeColors: ThemeColors | null;
}

interface ThemeColors {
	dark: Record<string, string>;
	light: Record<string, string>;
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

const publicDir = join(FRONTEND, "public");
const buildBrandingPath = join(FRONTEND, "src", "lib", "build-branding.ts");

function brandingUrl(apiUrl: string) {
	return new URL(`/branding/?slug=${encodeURIComponent(slug)}`, apiUrl).toString();
}

function extensionFrom(contentType: string | null, sourceUrl: string) {
	const fromType: Record<string, string> = {
		"image/avif": "avif",
		"image/jpeg": "jpg",
		"image/png": "png",
		"image/svg+xml": "svg",
		"image/webp": "webp",
	};
	if (contentType && fromType[contentType.split(";", 1)[0]]) return fromType[contentType.split(";", 1)[0]];
	const fromUrl = new URL(sourceUrl).pathname.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
	return fromUrl && ["avif", "jpg", "jpeg", "png", "svg", "webp"].includes(fromUrl) ? fromUrl : "png";
}

function createBrandingCss(colors: ThemeColors) {
	const variables = (colorSet: Record<string, string>) =>
		Object.entries(colorSet)
			.map(
				([name, value]) =>
					`--${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}:${value}`,
			)
			.join(";");
	return `:root{${variables(colors.light)}}:root.dark{${variables(colors.dark)}}\n`;
}

async function fetchBuildBranding(): Promise<Branding | null> {
	if (slug === "default") return null;
	if (!variant.apiUrl) throw new Error(`Variant "${slug}" requires apiUrl to fetch branding during build.`);

	const response = await fetch(brandingUrl(variant.apiUrl));
	if (!response.ok) throw new Error(`Could not fetch branding for "${slug}": HTTP ${response.status}.`);
	const branding = (await response.json()) as Branding;
	if (!branding.companyName || !branding.themeColors) {
		throw new Error(
			`Branding for "${slug}" is incomplete. Configure company name and theme colors before building.`,
		);
	}
	return branding;
}

async function writeBuildBranding(branding: Branding | null) {
	if (!branding) return;
	await mkdir(publicDir, { recursive: true });

	let logoUrl: string | null = null;
	let logoPath: string | null = null;
	if (branding.logoUrl) {
		const response = await fetch(branding.logoUrl);
		if (!response.ok) throw new Error(`Could not download branding logo: HTTP ${response.status}.`);
		const extension = extensionFrom(response.headers.get("content-type"), branding.logoUrl);
		const filename = `branding-logo.${extension}`;
		logoPath = join(publicDir, filename);
		await writeFile(logoPath, await response.arrayBuffer());
		logoUrl = `/${filename}`;
	}

	await writeFile(join(publicDir, "branding.css"), createBrandingCss(branding.themeColors));
	await writeFile(
		buildBrandingPath,
		`import type { ThemeColors } from "./theme-colors";\n\nexport interface BuildBranding {\n\tcompanyName: string;\n\tfooterText: string | null;\n\tga4Id: string | null;\n\tgtmId: string | null;\n\tlogoUrl: string | null;\n\tmetaPixelId: string | null;\n\tthemeColors: ThemeColors;\n}\n\nexport const buildBranding: BuildBranding = ${JSON.stringify(
			{
				companyName: branding.companyName,
				footerText: branding.footerText,
				ga4Id: branding.ga4Id,
				gtmId: branding.gtmId,
				logoUrl,
				metaPixelId: branding.metaPixelId,
				themeColors: branding.themeColors,
			},
			null,
			"\t",
		)} as BuildBranding;\n`,
	);

	if (logoPath) {
		const proc = Bun.spawnSync(["bunx", "@tauri-apps/cli", "icon", logoPath], {
			cwd: FRONTEND,
			stderr: "inherit",
			stdout: "inherit",
		});
		if (proc.exitCode !== 0) throw new Error("Could not generate native app icons from branding logo.");
		const iconPath = join(FRONTEND, "src-tauri", "icons", "128x128.png");
		if (!existsSync(iconPath)) throw new Error("Tauri icon generator did not produce 128x128.png.");
		await copyFile(iconPath, join(publicDir, "favicon.png"));
		await copyFile(iconPath, join(publicDir, "apple-touch-icon.png"));
	}

	console.log("  ✓ Fetched branding, generated palette, logo, favicon, and native app icons");
}

await writeBuildBranding(await fetchBuildBranding());

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
	await mkdir(publicDir, { recursive: true });
	const files = (await readdir(assetsDir)).filter(file => file !== ".gitkeep");
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

// --- 4. Legacy local icon fallback when branding has no remote logo ---
const iconSource = join(assetsDir, "icon.png");
if (existsSync(iconSource) && existsSync(tauriConfPath) && slug === "default") {
	console.log(`  → Generating src-tauri/icons/ from variants/${slug}/icon.png...`);
	const proc = Bun.spawnSync(["bunx", "@tauri-apps/cli", "icon", iconSource], {
		cwd: FRONTEND,
		stderr: "inherit",
		stdout: "inherit",
	});
	if (proc.exitCode === 0) {
		console.log("  ✓ Generated src-tauri/icons/");
	} else {
		console.error("  ✗ Failed to generate src-tauri/icons/ (tauri icon exited non-zero)");
		process.exit(1);
	}
} else {
	console.log(`  — No variants/${slug}/icon.png — skipping app-store icon generation`);
}

console.log(`Done — ${variant.appName} variant active.`);
