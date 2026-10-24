import type { GetPublicUnitsByUnitSlugMenu200 } from "@/lib/api";

export type UnitMenuSections = GetPublicUnitsByUnitSlugMenu200;

export function unitMenuUrl(baseUrl: string, unitSlug: string, taxes: boolean) {
	const url = new URL(`/${encodeURIComponent(unitSlug)}`, baseUrl);
	url.searchParams.set("menuOnly", "true");
	url.searchParams.set("taxes", String(taxes));
	return url.href;
}

export function menuExportFilename(unitSlug: string, taxes: boolean, extension: string) {
	return `cardapio-${unitSlug.replace(/[^a-zA-Z0-9_-]/g, "-")}-${taxes ? "com-taxas" : "sem-taxas"}.${extension}`;
}

export function downloadMenuImage(dataUrl: string, filename: string) {
	const link = document.createElement("a");
	link.href = dataUrl;
	link.download = filename;
	document.body.append(link);
	link.click();
	link.remove();
}

export async function loadMenuImages(sections: UnitMenuSections) {
	const urls = [...new Set(sections.flatMap(section => section.items.map(item => item.imageUrl)).filter(Boolean))];
	const images = new Map<string, string>();
	for (let offset = 0; offset < urls.length; offset += 4) {
		await Promise.all(urls.slice(offset, offset + 4).map(async url => {
			try {
				const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
				if (!response.ok) return;
				const bitmap = await createImageBitmap(await response.blob());
				try {
					const canvas = document.createElement("canvas");
					canvas.width = 160;
					canvas.height = 160;
					const context = canvas.getContext("2d");
					if (!context) return;
					context.fillStyle = "#fff";
					context.fillRect(0, 0, 160, 160);
					const scale = Math.min(160 / bitmap.width, 160 / bitmap.height);
					context.drawImage(bitmap, (160 - bitmap.width * scale) / 2, (160 - bitmap.height * scale) / 2, bitmap.width * scale, bitmap.height * scale);
					images.set(url, canvas.toDataURL("image/jpeg", 0.85));
				} finally {
					bitmap.close();
				}
			} catch {
				// Missing images or CORS restrictions must not prevent exporting the menu.
			}
		}));
	}
	return images;
}
