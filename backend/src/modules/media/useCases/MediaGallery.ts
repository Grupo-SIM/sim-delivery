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
			update: { lastUsedAt: new Date(), url },
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
		const filters: string[] = [`a."companyId" = $1`];

		if (search) {
			params.push(`%${escapeLike(search)}%`);
			// Matches the owning record (product, option, unit...) or its parent, e.g. the product of an option.
			filters.push(`EXISTS (
				SELECT 1 FROM "media_usage" s
				WHERE s."companyId" = a."companyId" AND media_filename(s."url") = a."filename"
					AND (s."name" ILIKE $${params.length} OR s."context" ILIKE $${params.length})
			)`);
		}
		if (cursor) {
			params.push(cursor.lastUsedAt, cursor.id);
			filters.push(`(a."lastUsedAt", a."id") < ($${params.length - 1}::timestamp, $${params.length})`);
		}
		params.push(limit + 1);

		const rows = await this.prisma.$queryRawUnsafe<GalleryRow[]>(
			`SELECT a."id", a."url", a."createdAt", a."lastUsedAt",
				COALESCE(
					jsonb_agg(DISTINCT jsonb_build_object('context', u."context", 'name', u."name", 'type', u."entityType"))
						FILTER (WHERE u."entityType" IS NOT NULL),
					'[]'::jsonb
				) AS "usedBy"
			FROM "media_asset" a
			LEFT JOIN "media_usage" u ON u."companyId" = a."companyId" AND media_filename(u."url") = a."filename"
			WHERE ${filters.join(" AND ")}
			GROUP BY a."id"
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
