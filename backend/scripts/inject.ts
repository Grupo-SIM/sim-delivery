import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const brandingPath = join(ROOT, "backend", "src", "shared", "infra", "branding.ts");

async function readEnvFile(path: string) {
	if (!existsSync(path)) return {};
	const lines = (await readFile(path, "utf8")).split("\n");
	return Object.fromEntries(
		lines.flatMap(line => {
			const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
			if (!match) return [];
			const rawValue = match[2];
			const value =
				rawValue.length >= 2 && ["'", '"'].includes(rawValue[0]) && rawValue.at(-1) === rawValue[0]
					? rawValue.slice(1, -1)
					: rawValue;
			return [[match[1], value]];
		}),
	);
}

for (const [key, value] of Object.entries(await readEnvFile(join(ROOT, "packages", "sql", ".env")))) {
	process.env[key] ??= value;
}

const slug = process.env.COMPANY_SLUG?.trim();
if (!slug) throw new Error("COMPANY_SLUG is required to run the branded backend.");

interface ThemeColors {
	light?: Record<string, string>;
}

const { PrismaClient, adapter } = await import("../../packages/sql/src/index.ts");
const prisma = new PrismaClient({ adapter });

let company: { logoUrl: string | null; name: string; themeColors: unknown } | null;
try {
	company = await prisma.company.findUnique({
		select: { logoUrl: true, name: true, themeColors: true },
		where: { slug },
	});
} finally {
	await prisma.$disconnect();
}

if (!company) throw new Error(`Company "${slug}" was not found.`);

const colors = (company.themeColors as ThemeColors | null)?.light;
const primaryColor = colors?.primary?.trim() || "#dc3a00";
const primaryForegroundColor = colors?.primaryForeground?.trim() || "#ffffff";

await writeFile(
	brandingPath,
	`export interface EmailBranding {
\tcompanyName: string;
\tlogoUrl: string | null;
\tprimaryColor: string;
\tprimaryForegroundColor: string;
}

export const emailBranding: EmailBranding = ${JSON.stringify(
		{
			companyName: company.name,
			logoUrl: company.logoUrl,
			primaryColor,
			primaryForegroundColor,
		},
		null,
		"\t",
	)};
`,
);

console.log(`Injected backend email branding for ${company.name} (${slug}).`);
