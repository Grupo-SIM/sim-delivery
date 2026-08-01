import { randomUUID } from "node:crypto";
import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";

const imageTypes = ["image/avif", "image/jpeg", "image/png", "image/webp"];
const fontTypes = ["font/otf", "font/ttf", "font/woff", "font/woff2"];
const assetTypes = {
	banner: imageTypes,
	"font-display": fontTypes,
	"font-family": fontTypes,
	logo: imageTypes,
	product: imageTypes,
	promotion: imageTypes,
	unit: imageTypes,
} as const;

const extensionByType: Record<string, string> = {
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
		"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(avif|jpg|otf|png|ttf|webp|woff|woff2)$",
});
const Asset = t.Union([
	t.Literal("banner"),
	t.Literal("font-display"),
	t.Literal("font-family"),
	t.Literal("logo"),
	t.Literal("product"),
	t.Literal("promotion"),
	t.Literal("unit"),
]);

export const MediaController = new Elysia({ prefix: "/media" })
	.use(GlobalPlugin)
	.get(
		"/:filename",
		({ params, redirect, storageProvider }) => redirect(storageProvider.getUrl(params.filename)),
		{ params: t.Object({ filename: Filename }) },
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

			const filename = `${randomUUID()}.${extension}`;
			await storageProvider.uploadFile({
				buffer: new Uint8Array(await file.arrayBuffer()),
				contentType: file.type,
				filename,
			});

			return { url: new URL(`/media/${filename}`, process.env.API_URL).href };
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

			await storageProvider.deleteFile(params.filename);
			return { ok: true };
		},
		{
			params: t.Object({ asset: Asset, filename: Filename }),
			response: t.Object({ ok: t.Boolean() }),
		},
	);
