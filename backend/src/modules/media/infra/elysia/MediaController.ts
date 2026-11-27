import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import {
	contentFilename,
	isContentFilename,
	OPTIMIZABLE_EXTENSIONS,
	optimizeOriginal,
	resizeToWebp,
	snapVariantWidth,
	UNTOUCHED_ASSETS,
	variantFilename,
	variantFilenames,
} from "@/modules/media/services/ImageVariants";
import { GlobalPlugin } from "@/shared/infra/elysia/global";

const imageTypes = ["image/avif", "image/jpeg", "image/png", "image/webp"];
const fontTypes = ["font/otf", "font/ttf", "font/woff", "font/woff2"];
const whatsAppAttachmentTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const assetTypes = {
	banner: imageTypes,
	"font-display": fontTypes,
	"font-family": fontTypes,
	logo: imageTypes,
	"mobile-icon": imageTypes,
	product: imageTypes,
	promotion: imageTypes,
	unit: imageTypes,
	whatsapp: whatsAppAttachmentTypes,
} as const;

const extensionByType: Record<string, string> = {
	"application/pdf": "pdf",
	"font/otf": "otf",
	"font/ttf": "ttf",
	"font/woff": "woff",
	"font/woff2": "woff2",
	"image/avif": "avif",
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

const UploadReturn = t.Object({ url: t.String({ format: "uri" }) });
const Filename = t.String({
	pattern:
		"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(avif|jpg|otf|pdf|png|ttf|webp|woff|woff2)$",
});
const Asset = t.Union([
	t.Literal("banner"),
	t.Literal("font-display"),
	t.Literal("font-family"),
	t.Literal("logo"),
	t.Literal("mobile-icon"),
	t.Literal("product"),
	t.Literal("promotion"),
	t.Literal("unit"),
	t.Literal("whatsapp"),
]);

const knownVariants = new Set<string>();
const pendingVariants = new Map<string, Promise<void>>();

export const MediaController = new Elysia({ prefix: "/media" })
	.use(GlobalPlugin)
	.get(
		"/:filename",
		async ({ params, query, redirect, set, storageProvider }) => {
			const extension = params.filename.split(".").pop() ?? "";
			if (!query.width || !OPTIMIZABLE_EXTENSIONS.includes(extension)) {
				return redirect(storageProvider.getUrl(params.filename));
			}

			const variant = variantFilename(params.filename, snapVariantWidth(query.width));
			if (!knownVariants.has(variant)) {
				let pending = pendingVariants.get(variant);
				if (!pending) {
					pending = (async () => {
						const existing = await fetch(storageProvider.getUrl(variant), { method: "HEAD" }).catch(() => null);
						if (!existing?.ok) {
							const original = await fetch(storageProvider.getUrl(params.filename));
							if (!original.ok) throw new Error("Media not found");

							await storageProvider.uploadFile({
								buffer: await resizeToWebp(
									new Uint8Array(await original.arrayBuffer()),
									snapVariantWidth(query.width as number),
								),
								contentType: "image/webp",
								filename: variant,
							});
						}
						knownVariants.add(variant);
					})().finally(() => pendingVariants.delete(variant));
					pendingVariants.set(variant, pending);
				}

				try {
					await pending;
				} catch {
					// Never break an <img>: fall back to the untouched original.
					return redirect(storageProvider.getUrl(params.filename));
				}
			}

			set.headers["cache-control"] = "public, max-age=86400";
			return redirect(storageProvider.getUrl(variant));
		},
		{ params: t.Object({ filename: Filename }), query: t.Object({ width: t.Optional(t.Numeric({ maximum: 4000, minimum: 16 })) }) },
	)
	.post(
		"/:asset",
		async ({ body, params, request, storageProvider }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(
				scope,
				["product", "promotion"].includes(params.asset) ? "menu" : "branding",
				"update",
			);

			const file = body.file;
			const extension = extensionByType[file.type];
			if (!assetTypes[params.asset].includes(file.type as never) || !extension) {
				throw new Error("Unsupported media type");
			}

			const raw = new Uint8Array(await file.arrayBuffer());
			const optimize = imageTypes.includes(file.type) && !UNTOUCHED_ASSETS.includes(params.asset);
			const buffer = optimize ? await optimizeOriginal(raw) : raw;
			const filename = contentFilename(buffer, optimize ? "webp" : extension);
			// Identical bytes always map to the same name: skip the upload when it already exists.
			const existing = await fetch(storageProvider.getUrl(filename), { method: "HEAD" }).catch(() => null);
			if (!existing?.ok) {
				await storageProvider.uploadFile({
					buffer,
					contentType: optimize ? "image/webp" : file.type,
					filename,
				});
			}

			const cdnUrl = process.env.CDN_URL?.replace(/\/+$/, "");
			return { url: cdnUrl ? `${cdnUrl}/${filename}` : new URL(`/media/${filename}`, process.env.API_URL).href };
		},
		{
			body: t.Object({ file: t.File({ maxSize: "10m" }) }),
			params: t.Object({ asset: Asset }),
			response: UploadReturn,
		},
	)
	.delete(
		"/:asset/:filename",
		async ({ params, request, storageProvider }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(
				scope,
				["product", "promotion"].includes(params.asset) ? "menu" : "branding",
				"update",
			);

			// Content-addressed files may be referenced by other records; only legacy random names are deleted.
			if (isContentFilename(params.filename)) return { ok: true };

			await storageProvider.deleteFile(params.filename);
			await Promise.all(variantFilenames(params.filename).map(variant => storageProvider.deleteFile(variant).catch(() => undefined)));
			return { ok: true };
		},
		{
			params: t.Object({ asset: Asset, filename: Filename }),
			response: t.Object({ ok: t.Boolean() }),
		},
	);
