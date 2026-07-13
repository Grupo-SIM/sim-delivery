/**
 * Resolves the company selected by VITE_COMPANY_SLUG directly through Prisma,
 * then writes the static storefront and Tauri branding artifacts.
 *
 * Runs automatically before `frontend` build and dev commands.
 */

import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname;
const FRONTEND = join(ROOT, "frontend");
const publicDir = join(FRONTEND, "public");
const brandingPath = join(FRONTEND, "src", "lib", "branding.ts");

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

// Explicit process variables win. Local frontend values override frontend/.env.
const databaseEnv = await readEnvFile(join(ROOT, "packages", "sql", ".env"));
const frontendEnv = {
	...(await readEnvFile(join(FRONTEND, ".env"))),
	...(await readEnvFile(join(FRONTEND, ".env.local"))),
};
for (const [key, value] of Object.entries({ ...databaseEnv, ...frontendEnv })) process.env[key] ??= value;

const slug = process.env.VITE_COMPANY_SLUG?.trim();
if (!slug) throw new Error("VITE_COMPANY_SLUG is required to run the branded frontend.");

interface ThemeColors {
	dark: Record<string, string>;
	light: Record<string, string>;
}

interface CompanyBranding {
	apiUrl: string | null;
	bannerUrl: string | null;
	footerText: string | null;
	ga4Id: string | null;
	gtmId: string | null;
	logoUrl: string | null;
	metaPixelId: string | null;
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

function createBrandingCss(colors: ThemeColors) {
	const variables = (colorSet: Record<string, string>) =>
		Object.entries(colorSet)
			.map(([name, value]) => `--${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}:${value}`)
			.join(";");
	return `:root{${variables(colors.light)}}:root.dark{${variables(colors.dark)}}\n`;
}

function requireBuildValue<T>(value: T | null, name: string): T {
	if (value === null) throw new Error(`Company "${slug}" needs ${name} before frontend build.`);
	return value;
}

const { PrismaClient, adapter } = await import("../../packages/sql/src/index.ts");
const prisma = new PrismaClient({ adapter });

let company: CompanyBranding | null;
try {
	company = await prisma.company.findUnique({
		select: {
			apiUrl: true,
			bannerUrl: true,
			footerText: true,
			ga4Id: true,
			gtmId: true,
			logoUrl: true,
			metaPixelId: true,
			name: true,
			packageName: true,
			siteUrl: true,
			themeColors: true,
		},
		where: { slug },
	});
} finally {
	await prisma.$disconnect();
}

if (!company) throw new Error(`Company "${slug}" was not found.`);

const apiUrl =
	company.apiUrl?.trim() ||
	requireBuildValue(process.env.VITE_API_URL?.trim() || null, "apiUrl or VITE_API_URL");
const logoSourceUrl = requireBuildValue(company.logoUrl, "logoUrl");
const packageName =
	company.packageName?.trim() || `com.jbmidia.${slug.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;
const siteUrl =
	company.siteUrl?.trim() ||
	requireBuildValue(process.env.VITE_APP_URL?.trim() || null, "siteUrl or VITE_APP_URL");
const themeColors = requireBuildValue(company.themeColors, "themeColors");

await mkdir(publicDir, { recursive: true });
const logoResponse = await fetch(logoSourceUrl);
if (!logoResponse.ok) throw new Error(`Could not download branding logo: HTTP ${logoResponse.status}.`);

const logoFilename = `logo.${extensionFrom(logoResponse.headers.get("content-type"), logoSourceUrl)}`;
const logoPath = join(publicDir, logoFilename);
await writeFile(logoPath, await logoResponse.arrayBuffer());
await writeFile(join(publicDir, "branding.css"), createBrandingCss(themeColors));

await writeFile(
	brandingPath,
	`import type { ThemeColors } from "./theme-colors";\n\nexport interface Branding {\n\tapiUrl: string;\n\tbannerUrl: string | null;\n\tcompanyName: string;\n\tfooterText: string | null;\n\tga4Id: string | null;\n\tgtmId: string | null;\n\tlogoUrl: string;\n\tmetaPixelId: string | null;\n\tpackageName: string;\n\tsiteUrl: string;\n\tthemeColors: ThemeColors;\n}\n\nexport const branding: Branding = ${JSON.stringify(
		{
			apiUrl,
			bannerUrl: company.bannerUrl,
			companyName: company.name,
			footerText: company.footerText,
			ga4Id: company.ga4Id,
			gtmId: company.gtmId,
			logoUrl: `/${logoFilename}`,
			metaPixelId: company.metaPixelId,
			packageName,
			siteUrl,
			themeColors,
		},
		null,
		"\t",
	)} as Branding;\n`,
);

const tauriConfPath = join(FRONTEND, "src-tauri", "tauri.conf.json");
if (existsSync(tauriConfPath)) {
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

	const conf = JSON.parse(await Bun.file(tauriConfPath).text());
	conf.identifier = packageName;
	conf.productName = company.name;
	if (conf.app?.windows?.[0]) conf.app.windows[0].title = company.name;
	await writeFile(tauriConfPath, `${JSON.stringify(conf, null, "\t")}\n`);
}

console.log(`Injected branding for ${company.name} (${slug}).`);
