/**
 * Resolves the company selected by VITE_COMPANY_SLUG directly through Prisma,
 * then writes the static storefront and Tauri branding artifacts.
 *
 * Runs automatically before `frontend` build and dev commands.
 */

import { existsSync } from "node:fs";
import { copyFile, cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { resolveThemeColors } from "../src/lib/theme-colors";
import { fetchBrandingAsset, resolveBrandingAssetUrl } from "./branding-assets";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const FRONTEND = join(ROOT, "frontend");
let stage: string;


const indexHtmlPath = join(FRONTEND, "scripts", "defaults", "index.html");

async function readEnvFile(path: string) {
	if (!existsSync(path)) return {};
	const lines = (await readFile(path, "utf8")).split("\n");
	return Object.fromEntries(
		lines.flatMap(line => {
			const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
			if (!match || match[1].startsWith("#")) return [];
			const rawValue = match[2];
			const value =
				rawValue.length >= 2 && ["'", '"'].includes(rawValue[0]) && rawValue.at(-1) === rawValue[0]
					? rawValue.slice(1, -1)
					: rawValue;
			return [[match[1], value]];
		}),
	);
}

if (process.env.NODE_ENV !== "production") {
	// Explicit process variables win. Local frontend values override frontend/.env.
	const databaseEnv = await readEnvFile(join(ROOT, "packages", "sql", ".env"));
	const frontendEnv = {
		...(await readEnvFile(join(FRONTEND, ".env"))),
		...(await readEnvFile(join(FRONTEND, ".env.local"))),
	};

	for (const [key, value] of Object.entries({ ...databaseEnv, ...frontendEnv })) {
		process.env[key] ??= value;
	}
}

const slug = process.env.COMPANY_SLUG?.trim() || process.env.VITE_COMPANY_SLUG?.trim();
if (!slug) throw new Error("COMPANY_SLUG (or VITE_COMPANY_SLUG) is required to run the branded frontend.");

interface ThemeColors {
	dark: Record<string, string>;
	light: Record<string, string>;
}

const DEFAULT_FONT_FAMILY = "Inter";
const DEFAULT_FONT_DISPLAY = "Inter";

interface CompanyBranding {
	welcomeEyebrow: string | null;
	welcomeDescription: string | null;
	allowThemeToggle: boolean;
	apiUrl: string | null;
	defaultTheme: string | null;
	fontDisplay: string | null;
	fontDisplayUrl: string | null;
	fontFamily: string | null;
	fontFamilyUrl: string | null;
	footerText: string | null;
	ga4Id: string | null;
	gtmId: string | null;
	logoUrl: string | null;
	metaPixelId: string | null;
	mobileIconUrl: string | null;
	name: string;
	packageName: string | null;
	siteUrl: string | null;
	themeColors: ThemeColors | null;
}

function extensionFrom(contentType: string | null, sourceUrl: string) {
	const extensions: Record<string, string> = {
		"image/avif": "avif",
		"image/jpeg": "jpg",
		"image/png": "png",
		"image/svg+xml": "svg",
		"image/webp": "webp",
	};
	const mediaType = contentType?.split(";", 1)[0];
	if (mediaType && extensions[mediaType]) return extensions[mediaType];
	const fromUrl = new URL(sourceUrl).pathname.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
	return fromUrl && ["avif", "jpg", "jpeg", "png", "svg", "webp"].includes(fromUrl) ? fromUrl : "png";
}

function createBrandingCss(colors: ThemeColors, fontFamily: string, fontDisplay: string) {
	const variables = (colorSet: Record<string, string>) =>
		Object.entries(colorSet)
			.map(([name, value]) => `--${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}:${value}`)
			.join(";");
	const fontVariables = `--font-sans:"${fontFamily}", system-ui, sans-serif;--font-display:"${fontDisplay}", "${fontFamily}", system-ui, sans-serif`;
	return `:root{${variables(colors.light)};${fontVariables}}:root.dark{${variables(colors.dark)}}\n`;
}

function googleFontsUrl(families: string[]) {
	const params = [...new Set(families)]
		.map(
			family =>
				`family=${encodeURIComponent(family.trim()).replace(/%20/g, "+")}:wght@400;500;600;700;800;900`,
		)
		.join("&");
	return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

function requireBuildValue<T>(value: T | null, name: string): T {
	if (value === null) throw new Error(`Company "${slug}" needs ${name} before frontend build.`);
	return value;
}

const { PrismaClient, adapter } = await import("../../packages/sql/src/index.ts");
const prisma = new PrismaClient({ adapter });

let company: CompanyBranding | null;
try {
	const branding = await prisma.company.findUnique({
		select: {
			allowThemeToggle: true,
			apiUrl: true,
			defaultTheme: true,
			fontDisplay: true,
			fontDisplayUrl: true,
			fontFamily: true,
			fontFamilyUrl: true,
			footerText: true,
			ga4Id: true,
			gtmId: true,
			logoUrl: true,
			metaPixelId: true,
			mobileIconUrl: true,
			name: true,
			packageName: true,
			siteUrl: true,
			themeColors: true,
		},
		where: { slug },
	});
	// Builds can precede deployment migrations. JSON lookup returns null for absent
	// optional copy columns while still surfacing database/required branding errors.
	const [welcomeCopy] = branding
		? await prisma.$queryRaw<
				{ welcomeEyebrow: string | null; welcomeDescription: string | null }[]
			>`
				SELECT to_jsonb(c)->>'welcomeEyebrow' AS "welcomeEyebrow",
				       to_jsonb(c)->>'welcomeDescription' AS "welcomeDescription"
				FROM "company" AS c WHERE c."slug" = ${slug}
			`
		: [];
	company = branding
		? {
				...branding,
				welcomeEyebrow: welcomeCopy?.welcomeEyebrow ?? null,
				welcomeDescription: welcomeCopy?.welcomeDescription ?? null,
			}
		: null;
} finally {
	await prisma.$disconnect();
}

if (!company) throw new Error(`Company not found: ${slug}`);

const apiUrl =
	company.apiUrl?.trim() ||
	requireBuildValue(process.env.VITE_API_URL?.trim() || null, "apiUrl or VITE_API_URL");
const logoSourceUrl = resolveBrandingAssetUrl(company.logoUrl, apiUrl);
const fontFamily = company.fontFamily?.trim() || DEFAULT_FONT_FAMILY;
const fontDisplay = company.fontDisplay?.trim() || DEFAULT_FONT_DISPLAY;
const packageName =
	company.packageName?.trim() || `com.jbmidia.${slug.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;
const siteUrl = requireBuildValue(
	company.siteUrl?.trim() || process.env.VITE_APP_URL?.trim() || null,
	"siteUrl or VITE_APP_URL",
);
const themeColors = resolveThemeColors(company.themeColors as Parameters<typeof resolveThemeColors>[0]);
for (const [name, value] of Object.entries({ apiUrl, siteUrl })) {
	const url = new URL(value);
	if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
		throw new Error(`Company "${slug}" needs a valid HTTP(S) ${name}.`);
	}
}
if (!/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/.test(packageName)) {
	throw new Error(`Company "${slug}" has an invalid packageName.`);
}

stage = await mkdtemp(join(tmpdir(), "company-branding-"));
try {
	const publicDir = join(stage, "public");
	const brandingPath = join(stage, "branding.ts");
	await mkdir(publicDir, { recursive: true });
	let logoPath: string | null = null;
	let logoUrl = "";
	const logoAsset = await fetchBrandingAsset(logoSourceUrl);
	if (logoSourceUrl && logoAsset) {
		const logoFilename = `logo.${extensionFrom(logoAsset.contentType, logoSourceUrl)}`;
		logoPath = join(publicDir, logoFilename);
		await writeFile(logoPath, logoAsset.bytes);
		logoUrl = `/${logoFilename}`;
	}
	await writeFile(join(publicDir, "branding.css"), createBrandingCss(themeColors, fontFamily, fontDisplay));
	
	await writeFile(
		brandingPath,
		`import type { ThemeColors } from "./theme-colors";\n\nexport interface Branding {\n\twelcomeEyebrow?: string | null;\n\twelcomeDescription?: string | null;\n\tallowThemeToggle: boolean;\n\tdefaultTheme: "dark" | "light";\n\tapiUrl: string;\n\tcompanyName: string;\n\tcompanySlug: string;\n\tfontDisplay: string;\n\tfontDisplayUrl: string | null;\n\tfontFamily: string;\n\tfontFamilyUrl: string | null;\n\tfooterFacebookUrl?: string | null;\n\tfooterInstagramUrl?: string | null;\n\tfooterPaymentMethods?: string[];\n\tfooterSupportEmail?: string | null;\n\tfooterText: string | null;\n\tfooterWhatsApp?: string | null;\n\tga4Id: string | null;\n\tgtmId: string | null;\n\tlogoUrl: string;\n\tmobileIconUrl?: string | null;\n\tmetaPixelId: string | null;\n\tpackageName: string;\n\tsiteUrl: string;\n\tthemeColors: ThemeColors;\n\twhatsAppEnabled: boolean;\n}\n\nexport const branding: Branding = ${JSON.stringify(
			{
				allowThemeToggle: company.allowThemeToggle,
				welcomeEyebrow: company.welcomeEyebrow,
				welcomeDescription: company.welcomeDescription,
				apiUrl,
				companyName: company.name,
				companySlug: slug,
				defaultTheme: company.defaultTheme === "dark" ? "dark" : "light",
				fontDisplay,
				fontDisplayUrl: company.fontDisplayUrl,
				fontFamily,
				fontFamilyUrl: company.fontFamilyUrl,
				footerText: company.footerText,
				ga4Id: company.ga4Id,
				gtmId: company.gtmId,
				logoUrl,
				metaPixelId: company.metaPixelId,
				packageName,
				siteUrl,
				themeColors,
				whatsAppEnabled: false,
			},
			null,
			"\t",
		)} as Branding;\n`,
	);
	
	/**
	 * Matches Android's adaptive icon safe zone (66dp visible circle inside a 108dp canvas), so the
	 * mark stays clear of circular/rounded masks applied by OS launchers and app stores without
	 * looking artificially shrunk.
	 */
	const LOGO_FALLBACK_ICON_PADDING = 0.19;
	
	/**
	 * The Tauri icon generator requires a square source image, but a branding logo is free-form
	 * (e.g. a wide wordmark). Pads it onto a transparent square canvas sized to the longer side
	 * (plus optional extra margin) so icon generation never fails on the logo's actual aspect ratio
	 * and the mark isn't flush against the edge once masked into a circle/rounded shape.
	 */
	async function squareIconSource(sourcePath: string, extraPadding = 0): Promise<string> {
		const image = sharp(sourcePath);
		const { height = 0, width = 0 } = await image.metadata();
		if (width === height && width > 0 && extraPadding === 0) return sourcePath;
	
		const size = Math.ceil(Math.max(width, height) * (1 + extraPadding * 2));
		const squaredPath = join(stage, `branding-icon-source-${extraPadding}.png`);
		await image
			.resize(width, height)
			.extend({
				background: { alpha: 0, b: 0, g: 0, r: 0 },
				bottom: Math.ceil((size - height) / 2),
				left: Math.floor((size - width) / 2),
				right: Math.ceil((size - width) / 2),
				top: Math.floor((size - height) / 2),
			})
			.png()
			.toFile(squaredPath);
		return squaredPath;
	}
	
	const tauriConfPath = join(FRONTEND, "scripts", "defaults", "tauri.conf.json");
	if (existsSync(tauriConfPath)) {
		// A dedicated mobile icon is assumed to already be composed/padded by whoever uploaded it, so
		// it's used as-is (only squared, never re-padded). Without one, fall back to the general logo
		// and add safe padding automatically so it doesn't look flush against circular/rounded masks.
		let iconSourcePath: string | null = null;
		const mobileIconUrl = resolveBrandingAssetUrl(company.mobileIconUrl, apiUrl);
		const mobileIconAsset = await fetchBrandingAsset(mobileIconUrl);
		if (mobileIconUrl && mobileIconAsset) {
			const mobileIconFilename = `mobile-icon.${extensionFrom(mobileIconAsset.contentType, mobileIconUrl)}`;
			const mobileIconPath = join(publicDir, mobileIconFilename);
			await writeFile(mobileIconPath, mobileIconAsset.bytes);
			iconSourcePath = await squareIconSource(mobileIconPath);
		}
		if (!iconSourcePath && logoPath) {
			iconSourcePath = await squareIconSource(logoPath, LOGO_FALLBACK_ICON_PADDING);
		}
		if (iconSourcePath) {
			const proc = Bun.spawnSync([join(FRONTEND, "node_modules", ".bin", "tauri"), "icon", iconSourcePath, "--output", join(stage, "icons")], {
				cwd: FRONTEND,
				stderr: "inherit",
				stdout: "inherit",
			});
			if (proc.exitCode !== 0) throw new Error("Could not generate native app icons.");
	
			const iconPath = join(stage, "icons", "128x128.png");
			if (!existsSync(iconPath)) throw new Error("Tauri icon generator did not produce 128x128.png.");
			await copyFile(iconPath, join(publicDir, "favicon.png"));
			await copyFile(iconPath, join(publicDir, "apple-touch-icon.png"));
		} else {
			// Do not ship icons left over from a previously branded build.
			const emptyIcon = await sharp({
				create: { background: { alpha: 0, b: 0, g: 0, r: 0 }, channels: 4, height: 128, width: 128 },
			})
				.png()
				.toBuffer();
			await writeFile(join(publicDir, "favicon.png"), emptyIcon);
			await writeFile(join(publicDir, "apple-touch-icon.png"), emptyIcon);
			const proc = Bun.spawnSync([join(FRONTEND, "node_modules", ".bin", "tauri"), "icon", join(publicDir, "favicon.png"), "--output", join(stage, "icons")], { cwd: FRONTEND });
			if (proc.exitCode !== 0) throw new Error("Could not generate fallback native icons.");
		}
	
		const conf = JSON.parse(await Bun.file(tauriConfPath).text());
		conf.identifier = packageName;
		conf.productName = company.name || "Delivery";
		if (conf.app?.windows?.[0]) conf.app.windows[0].title = company.name || "Delivery";
		await writeFile(join(stage, "tauri.conf.json"), `${JSON.stringify(conf, null, "\t")}\n`);
	}
	
	const indexHtml = await readFile(indexHtmlPath, "utf8");
	const initialTheme = company.defaultTheme === "dark" ? "dark" : "light";
	const updatedIndexHtml = indexHtml
		.replace(
			/<title>[^<]*<\/title>/,
			`<title>${company.name.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</title>`,
		)
		.replace(
			/document\.documentElement\.classList\.add\("(?:dark|light)"\)/,
			`document.documentElement.classList.add("${initialTheme}")`,
		)
		.replace(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]+/, googleFontsUrl([fontDisplay, fontFamily]));
	await writeFile(join(stage, "index.html"), updatedIndexHtml);
	
	// Only publish after all downloads, image processing and config generation succeed.
	const targetPublic = join(FRONTEND, "public");
	await mkdir(targetPublic, { recursive: true });
	for (const name of await readdir(targetPublic)) {
		if (/^(?:logo|mobile-icon)\./.test(name)) await rm(join(targetPublic, name), { force: true });
	}
	for (const name of await readdir(publicDir)) {
		await copyFile(join(publicDir, name), join(targetPublic, name));
	}
	const targetIcons = join(FRONTEND, "src-tauri", "icons");
	await rm(targetIcons, { recursive: true, force: true });
	await cp(join(stage, "icons"), targetIcons, { recursive: true });
	
	await copyFile(brandingPath, join(FRONTEND, "src", "lib", "branding.ts"));
	await copyFile(join(stage, "tauri.conf.json"), join(FRONTEND, "src-tauri", "tauri.conf.json"));
	await copyFile(join(stage, "index.html"), join(FRONTEND, "index.html"));
} finally {
	await rm(stage, { recursive: true, force: true });
}

console.log(`Injected branding for ${company.name} (${slug}).`);
