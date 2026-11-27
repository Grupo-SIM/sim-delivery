import { describe, expect, it } from "bun:test";
import { variantFilenames } from "@/modules/media/services/ImageVariants";
import type { PrismaInstance } from "@/shared/infra/sql";
import { SweepUnusedMedia } from "./SweepUnusedMedia";

const FILENAME = "11111111-2222-5333-a444-555555555555.webp";
const NOW = new Date("2026-12-01T00:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1_000;

interface Options {
	hiddenReference?: boolean;
	rowsDeleted?: number;
	sharedAsset?: boolean;
	usedElsewhere?: boolean;
}

function setup({ hiddenReference = false, rowsDeleted = 1, sharedAsset = false, usedElsewhere = false }: Options = {}) {
	const deleted: string[] = [];
	const prisma = {
		$executeRawUnsafe: async () => 1,
		$queryRawUnsafe: async (sql: string) =>
			sql.includes("whatsapp_notification") ? [{ referenced: hiddenReference }] : [{ used: usedElsewhere }],
		mediaAsset: {
			count: async () => (sharedAsset ? 1 : 0),
			deleteMany: async () => ({ count: rowsDeleted }),
			findMany: async () => [{ filename: FILENAME, id: "asset-1" }],
		},
	} as unknown as PrismaInstance;
	const storage = {
		deleteFile: async (filename: string) => {
			deleted.push(filename);
		},
	};

	return { deleted, sweep: new SweepUnusedMedia(prisma, storage, 7 * DAY_MS) };
}

describe("SweepUnusedMedia", () => {
	it("deletes the storage object and every resized variant of an expired unused asset", async () => {
		const { deleted, sweep } = setup();

		expect(await sweep.execute(NOW)).toEqual({ deleted: 1, marked: 1 });
		expect(deleted).toEqual([FILENAME, ...variantFilenames(FILENAME)]);
	});

	it("keeps the object when another company still has the same bytes registered", async () => {
		const { deleted, sweep } = setup({ sharedAsset: true });

		expect((await sweep.execute(NOW)).deleted).toBe(1);
		expect(deleted).toEqual([]);
	});

	it("keeps the object when a record of another company still references it", async () => {
		const { deleted, sweep } = setup({ usedElsewhere: true });

		await sweep.execute(NOW);
		expect(deleted).toEqual([]);
	});

	it("keeps the asset when JSON templates or avatars still reference it", async () => {
		const { deleted, sweep } = setup({ hiddenReference: true });

		expect((await sweep.execute(NOW)).deleted).toBe(0);
		expect(deleted).toEqual([]);
	});

	it("does nothing when a concurrent re-upload cleared the unused mark", async () => {
		const { deleted, sweep } = setup({ rowsDeleted: 0 });

		expect((await sweep.execute(NOW)).deleted).toBe(0);
		expect(deleted).toEqual([]);
	});
});
