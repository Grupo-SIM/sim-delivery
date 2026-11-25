/**
 * One-off: re-encodes already-uploaded raster product/category/promotion/unit/banner images as WebP (max 1600px),
 * uploads them under a new filename and repoints every DB column that references the old URL.
 * Logos, PWA icons, fonts and WhatsApp attachments are left alone. Old files are kept unless --delete-old is
 * passed, so a bad run can be rolled back by restoring the DB values. Safe to re-run: webp URLs are skipped.
 *
 * Dry run by default; --execute uploads and updates the DB it is connected to (check DATABASE_URL first!).
 *
 *   bun ./scripts/convert-media-to-webp.ts [--execute] [--delete-old]
 */
import { randomUUID } from "node:crypto";
import { optimizeOriginal, variantFilenames } from "../src/modules/media/services/ImageVariants";
import { prisma } from "../src/shared/infra/sql";
import { resolveProvider, storageProviders } from "@hyoretsu/providers";

const execute = process.argv.includes("--execute");
const deleteOld = process.argv.includes("--delete-old");

const storage = await resolveProvider(storageProviders, process.env.STORAGE_DRIVER);
const cdnUrl = process.env.CDN_URL?.replace(/\/+$/, "");
const mediaPrefixes = [cdnUrl && `${cdnUrl}/`, process.env.API_URL && `${process.env.API_URL.replace(/\/+$/, "")}/media/`].filter(Boolean) as string[];
const convertible = /\/([0-9a-f-]{36})\.(png|jpg|avif)$/;

const toConvert = (url: string | null | undefined) =>
	!!url && mediaPrefixes.some(prefix => url.startsWith(prefix)) && convertible.test(url);

// Scalar columns referencing a media URL: [model delegate, field].
const columns = [
	["category", "imageUrl"],
	["option", "imageUrl"],
	["product", "imageUrl"],
	["promotionalImage", "imageUrl"],
	["unit", "imageUrl"],
	["company", "unitFallbackImageUrl"],
	["unitProductOptionOverride", "imageUrl"],
	["unitProductAdditionalOption", "imageUrl"],
] as const;

const urls = new Set<string>();
for (const [model, field] of columns) {
	// biome-ignore lint/suspicious/noExplicitAny: dynamic delegate access
	const rows = await (prisma as any)[model].findMany({ select: { [field]: true }, where: { [field]: { not: null } } });
	for (const row of rows) if (toConvert(row[field])) urls.add(row[field]);
}
const units = await prisma.unit.findMany({ select: { bannerUrls: true, id: true } });
for (const unit of units) for (const url of unit.bannerUrls) if (toConvert(url)) urls.add(url);

console.info(`${urls.size} image(s) to convert${execute ? "" : " (dry run)"}`);

let converted = 0;
let failed = 0;
for (const oldUrl of urls) {
	try {
		const oldFilename = oldUrl.split("/").pop() as string;
		const response = await fetch(oldUrl);
		if (!response.ok) throw new Error(`download ${response.status}`);

		const original = new Uint8Array(await response.arrayBuffer());
		const optimized = await optimizeOriginal(original);
		console.info(`${oldFilename}: ${original.length} -> ${optimized.length} bytes`);
		if (!execute) continue;

		const newFilename = `${randomUUID()}.webp`;
		await storage.uploadFile({ buffer: optimized, contentType: "image/webp", filename: newFilename });
		const newUrl = oldUrl.replace(oldFilename, newFilename);

		for (const [model, field] of columns) {
			// biome-ignore lint/suspicious/noExplicitAny: dynamic delegate access
			await (prisma as any)[model].updateMany({ data: { [field]: newUrl }, where: { [field]: oldUrl } });
		}
		for (const unit of units.filter(each => each.bannerUrls.includes(oldUrl))) {
			const fresh = await prisma.unit.findUniqueOrThrow({ select: { bannerUrls: true }, where: { id: unit.id } });
			await prisma.unit.update({
				data: { bannerUrls: fresh.bannerUrls.map(url => (url === oldUrl ? newUrl : url)) },
				where: { id: unit.id },
			});
		}

		if (deleteOld) {
			for (const filename of [oldFilename, ...variantFilenames(oldFilename)]) {
				await storage.deleteFile(filename).catch(() => undefined);
			}
		}
		converted++;
	} catch (error) {
		failed++;
		console.error(`failed ${oldUrl}:`, error instanceof Error ? error.message : error);
	}
}

console.info(`converted ${converted}, failed ${failed}`);
if (!execute) console.info("Dry-run concluído. Confira DATABASE_URL e use --execute somente após conferir os resultados.");
if (failed) process.exitCode = 2;
await prisma.$disconnect();
