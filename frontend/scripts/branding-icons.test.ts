import { afterEach, describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { squareIconSource } from "./branding-icons";

const directories: string[] = [];

afterEach(async () => {
	await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

async function createSource(width: number, height: number) {
	const directory = await mkdtemp(join(tmpdir(), "branding-icons-test-"));
	directories.push(directory);
	const source = join(directory, "source.svg");
	await writeFile(source, `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><path fill="red" d="M0 0h${width}v${height}H0z"/></svg>`);
	return { output: join(directory, "icon.png"), source };
}

describe("squareIconSource", () => {
	it.each([[9000, 9000], [20000, 1000], [1000, 20000]])("bounds oversized %i×%i assets before Tauri decoding", async (width, height) => {
		const { source, output } = await createSource(width, height);
		await squareIconSource(source, output);
		const metadata = await sharp(output).metadata();
		expect(metadata.width).toBe(1024);
		expect(metadata.height).toBe(1024);
		expect(metadata.format).toBe("png");
	});

	it("centers a wordmark without stretching or cropping it", async () => {
		const { source, output } = await createSource(400, 100);
		await squareIconSource(source, output);
		const { data, info } = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
		const alpha = (x: number, y: number) => data[(y * info.width + x) * info.channels + 3];
		expect([info.width, info.height]).toEqual([400, 400]);
		expect(alpha(200, 149)).toBe(0);
		expect(alpha(0, 150)).toBe(255);
		expect(alpha(399, 249)).toBe(255);
		expect(alpha(200, 250)).toBe(0);
	});

	it("keeps fallback logo padding inside the size limit", async () => {
		const { source, output } = await createSource(2000, 2000);
		await squareIconSource(source, output, 0.19);
		const { data, info } = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
		const alpha = (x: number, y: number) => data[(y * info.width + x) * info.channels + 3];
		expect([info.width, info.height]).toEqual([1024, 1024]);
		expect(alpha(0, 512)).toBe(0);
		expect(alpha(140, 512)).toBe(0);
		expect(alpha(150, 512)).toBe(255);
		expect(alpha(873, 512)).toBe(255);
		expect(alpha(884, 512)).toBe(0);
	});

	it("normalizes an already-square PNG instead of bypassing conversion", async () => {
		const { source, output } = await createSource(64, 64);
		const pngSource = `${source}.png`;
		await sharp(source).png().toFile(pngSource);
		expect(await squareIconSource(pngSource, output)).toBe(output);
		const metadata = await sharp(output).metadata();
		expect([metadata.width, metadata.height]).toEqual([64, 64]);
	});
});
