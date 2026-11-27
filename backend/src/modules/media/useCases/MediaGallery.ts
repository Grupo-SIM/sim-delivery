import type { PrismaInstance } from "@/shared/infra/sql";
import type { MediaGalleryItemReturn, MediaGalleryQuery, MediaGalleryReturn } from "../dtos";

const DEFAULT_LIMIT = 24;

interface GalleryRow extends Omit<MediaGalleryItemReturn, "createdAt" | "lastUsedAt"> {
	createdAt: Date;
	lastUsedAt: Date;
}

/** Last path segment of a stored media URL, matching the SQL `media_filename` function. */
export function mediaFilenameFromUrl(url: string): string | undefined {
	return /([^/?#]+)(?:[?#].*)?$/.exec(url)?.[1];
}

/** Escapes `%`, `_` and `\` so user input is matched literally inside `ILIKE`. */
export function escapeLike(value: string): string {
	return value.replace(/[\\%_]/g, character => `\\${character}`);
}

export class RegisterMediaAsset {
	constructor(private readonly prisma: PrismaInstance) {}

	/** Same bytes map to the same filename, so re-uploading only moves the asset to the top of the gallery. */
	async execute(companyId: string | null, url: string): Promise<void> {
		const filename = mediaFilenameFromUrl(url);
		if (!companyId || !filename) return;

		await this.prisma.mediaAsset.upsert({
			create: { companyId, filename, url },
			update: { lastUsedAt: new Date(), unusedSince: null, url },
			where: { companyId_filename: { companyId, filename } },
		});
	}
}

export class RemoveMediaAsset {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, filename: string): Promise<void> {
		if (!companyId) return;
		await this.prisma.mediaAsset.deleteMany({ where: { companyId, filename } });
	}
}

export class ListMediaGallery {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, query: MediaGalleryQuery): Promise<MediaGalleryReturn> {
		if (!companyId) return { items: [], nextCursor: null };

		const limit = query.limit ?? DEFAULT_LIMIT;
		const search = query.search?.trim();
		const cursor = decodeCursor(query.cursor);
		const params: unknown[] = [companyId];
		const filters: string[] = [];
		let having = "";

		if (search) {
			params.push(`%${escapeLike(search)}%`);
			// Matches the owning record (product, option, unit...) or its parent, e.g. the product of an option.
			having = `HAVING bool_or(u."name" ILIKE $${params.length} OR u."context" ILIKE $${params.length})`;
		}
		if (cursor) {
			params.push(cursor.lastUsedAt, cursor.id);
			filters.push(`(a."lastUsedAt", a."id") < ($${params.length - 1}::timestamp, $${params.length})`);
		}
		params.push(limit + 1);

		// Gallery = uploaded assets (tracked in media_asset, matched to usages by filename, so CDN/API URL changes
		// don't matter) plus external URLs pasted into a record, which have no row and are matched by exact URL.
		const rows = await this.prisma.$queryRawUnsafe<GalleryRow[]>(
			`WITH usage AS (SELECT * FROM "media_usage" WHERE "companyId" = $1),
			managed AS (
				SELECT "id", "filename", "url", "createdAt", "lastUsedAt" FROM "media_asset" WHERE "companyId" = $1
			),
			external AS (
				SELECT md5(u."url") AS "id", NULL::TEXT AS "filename", u."url",
					min(u."createdAt") AS "createdAt", max(u."createdAt") AS "lastUsedAt"
				FROM usage u
				WHERE NOT EXISTS (SELECT 1 FROM managed m WHERE m."filename" = media_filename(u."url"))
				GROUP BY u."url"
			),
			assets AS (SELECT * FROM managed UNION ALL SELECT * FROM external)
			SELECT a."id", a."url", a."createdAt", a."lastUsedAt",
				COALESCE(
					jsonb_agg(DISTINCT jsonb_build_object('context', u."context", 'name', u."name", 'type', u."entityType"))
						FILTER (WHERE u."entityType" IS NOT NULL),
					'[]'::jsonb
				) AS "usedBy"
			FROM assets a
			LEFT JOIN usage u ON CASE
				WHEN a."filename" IS NULL THEN u."url" = a."url"
				ELSE media_filename(u."url") = a."filename"
			END
			${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
			GROUP BY a."id", a."url", a."createdAt", a."lastUsedAt"
			${having}
			ORDER BY a."lastUsedAt" DESC, a."id" DESC
			LIMIT $${params.length}`,
			...params,
		);

		const page = rows.slice(0, limit);
		const last = page.at(-1);
		return {
			items: page.map(row => ({
				createdAt: row.createdAt.toISOString(),
				id: row.id,
				lastUsedAt: row.lastUsedAt.toISOString(),
				url: row.url,
				usedBy: row.usedBy,
			})),
			nextCursor: rows.length > limit && last ? encodeCursor(last) : null,
		};
	}
}

function encodeCursor(row: Pick<GalleryRow, "id" | "lastUsedAt">): string {
	return Buffer.from(`${row.lastUsedAt.toISOString()}|${row.id}`).toString("base64url");
}

function decodeCursor(cursor?: string): { id: string; lastUsedAt: string } | undefined {
	if (!cursor) return;
	const [lastUsedAt, id] = Buffer.from(cursor, "base64url").toString().split("|");
	if (!lastUsedAt || !id || Number.isNaN(Date.parse(lastUsedAt))) return;
	return { id, lastUsedAt };
}
