import Elysia, { t } from "elysia";
import { AuthGuard } from "@/modules/users/guards";
import { UserErrors } from "@/modules/users/errors";
import { DomainError } from "@/shared/errors";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import type { PrismaInstance } from "@/shared/infra/sql";
import {
	ResolvedUtmLinkReturn,
	ResolveUtmLinkQuery,
	UtmLinkBody,
	UtmLinkListReturn,
	UtmLinkReturn,
} from "../../dtos";
import { UtmLinks } from "../../useCases";

async function requireSuperAdmin(request: Request, prisma: PrismaInstance) {
	const auth = await AuthGuard.execute(request.headers);
	const user = await prisma.user.findUnique({ select: { role: true }, where: { id: auth.userId } });
	if (user?.role !== "superAdmin") throw new DomainError(UserErrors.FORBIDDEN);
}

export const MarketingController = new Elysia({ detail: { tags: ["Marketing"] } })
	.use(GlobalPlugin)
	.group("/marketing", app =>
		app
			.decorate(({ prisma }) => ({ prisma, utmLinks: new UtmLinks(prisma) }))
			// Public: the storefront resolves `/utm/<path>` here before redirecting.
			.get("/utm-links/resolve", ({ query, utmLinks }) => utmLinks.resolve(query.slug, query.path), {
				query: ResolveUtmLinkQuery,
				response: ResolvedUtmLinkReturn,
			})
			.group("/utm-links", admin =>
				admin
					.onBeforeHandle(async ({ prisma, request }) => requireSuperAdmin(request, prisma))
					.get("/", ({ utmLinks }) => utmLinks.list(), { response: UtmLinkListReturn })
					.post("/", ({ body, utmLinks }) => utmLinks.create(body), { body: UtmLinkBody, response: UtmLinkReturn })
					.patch("/:id", ({ body, params, utmLinks }) => utmLinks.update(params.id, body), {
						body: UtmLinkBody,
						response: UtmLinkReturn,
					})
					.delete(
						"/:id",
						async ({ params, utmLinks }) => {
							await utmLinks.delete(params.id);
							return { ok: true };
						},
						{ response: t.Object({ ok: t.Boolean() }) },
					),
			),
	);
