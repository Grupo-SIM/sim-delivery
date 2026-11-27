import { variantFilenames } from "@/modules/media/services/ImageVariants";
import type { PrismaInstance } from "@/shared/infra/sql";
import { escapeLike } from "./MediaGallery";

const INTERVAL_MS = 60 * 60 * 1_000;
const BATCH_SIZE = 100;
const DAY_MS = 24 * 60 * 60 * 1_000;
const DEFAULT_RETENTION_DAYS = 7;

interface DeletableStorage {
	deleteFile(filename: string): Promise<unknown>;
}

/** Same `usage` match used by the gallery: the asset's filename appears in a record of its own company. */
const OWN_USAGE = `EXISTS (
	SELECT 1 FROM "media_usage" u WHERE u."companyId" = a."companyId" AND media_filename(u."url") = a."filename"
)`;

/**
 * Deletes gallery images nothing references any more. Two phases keep it safe against uploads that were not
 * saved yet: a pass first stamps `unusedSince`, and only assets still unused after the retention period are
 * deleted (row first, then the storage object and its resized variants).
 */
export class SweepUnusedMedia {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly storage: DeletableStorage,
		private readonly retentionMs = DEFAULT_RETENTION_DAYS * DAY_MS,
	) {}

	async execute(now = new Date()): Promise<{ deleted: number; marked: number }> {
		const timestamp = now.toISOString();
		const marked = await this.prisma.$executeRawUnsafe(
			`UPDATE "media_asset" a SET "unusedSince" = $1::timestamp WHERE a."unusedSince" IS NULL AND NOT ${OWN_USAGE}`,
			timestamp,
		);
		await this.prisma.$executeRawUnsafe(
			`UPDATE "media_asset" a SET "unusedSince" = NULL WHERE a."unusedSince" IS NOT NULL AND ${OWN_USAGE}`,
		);

		const cutoff = new Date(now.getTime() - this.retentionMs);
		const candidates = await this.prisma.mediaAsset.findMany({
			orderBy: { unusedSince: "asc" },
			take: BATCH_SIZE,
			where: { unusedSince: { lt: cutoff } },
		});

		let deleted = 0;
		for (const asset of candidates) {
			try {
				if (await this.delete(asset, cutoff)) deleted += 1;
			} catch (error) {
				console.error(`Failed to delete unused media ${asset.filename}`, error);
			}
		}

		return { deleted, marked };
	}

	private async delete(asset: { filename: string; id: string }, cutoff: Date): Promise<boolean> {
		// References the usage view cannot see (JSON blobs, user avatars): keep the asset rather than break them.
		if (await this.hasHiddenReference(asset.filename)) return false;

		// Guarded by `unusedSince` so a concurrent re-upload (which clears it) wins.
		const { count } = await this.prisma.mediaAsset.deleteMany({
			where: { id: asset.id, unusedSince: { lt: cutoff } },
		});
		if (count === 0) return false;

		// Content-addressed objects are shared: another company's asset or record may still point at them.
		const stillShared =
			(await this.prisma.mediaAsset.count({ where: { filename: asset.filename } })) > 0 ||
			(await this.isUsedByAnyCompany(asset.filename));
		if (stillShared) return true;

		await this.storage.deleteFile(asset.filename);
		await Promise.all(variantFilenames(asset.filename).map(variant => this.storage.deleteFile(variant).catch(() => undefined)));
		return true;
	}

	private async isUsedByAnyCompany(filename: string): Promise<boolean> {
		const [row] = await this.prisma.$queryRawUnsafe<{ used: boolean }[]>(
			`SELECT EXISTS (SELECT 1 FROM "media_usage" u WHERE media_filename(u."url") = $1) AS "used"`,
			filename,
		);
		return row?.used ?? true;
	}

	private async hasHiddenReference(filename: string): Promise<boolean> {
		const like = `%${escapeLike(filename)}%`;
		const [row] = await this.prisma.$queryRawUnsafe<{ referenced: boolean }[]>(
			`SELECT (
				EXISTS (
					SELECT 1 FROM "company" c WHERE concat_ws(' ', c."receiptTemplate"::text, c."themeColors"::text,
						c."orderStatusWhatsAppTemplates"::text, c."orderStatusEmailTemplates"::text) LIKE $1
				)
				OR EXISTS (SELECT 1 FROM "whatsapp_notification" n WHERE n."attachments"::text LIKE $1)
				OR EXISTS (SELECT 1 FROM "user" u WHERE u."image" LIKE $1)
			) AS "referenced"`,
			like,
		);
		return row?.referenced ?? true;
	}
}

/** Hourly sweep. `MEDIA_UNUSED_RETENTION_DAYS=0` disables the automatic deletion entirely. */
export function startUnusedMediaSweep(prisma: PrismaInstance, storage: DeletableStorage): () => void {
	const retentionDays = Number(process.env.MEDIA_UNUSED_RETENTION_DAYS ?? DEFAULT_RETENTION_DAYS);
	if (!Number.isFinite(retentionDays) || retentionDays <= 0) return () => undefined;

	const sweep = new SweepUnusedMedia(prisma, storage, retentionDays * DAY_MS);
	const run = () => void sweep.execute().catch(error => console.error("Failed to sweep unused media", error));

	run();
	const timer = setInterval(run, INTERVAL_MS);
	timer.unref();
	return () => clearInterval(timer);
}
