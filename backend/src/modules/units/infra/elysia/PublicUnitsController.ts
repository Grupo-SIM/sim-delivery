import Elysia, { t } from "elysia";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import {
	FreightSimulateBody,
	FreightSimulateReturn,
	PublicMenuReturn,
	PublicUnitListReturn,
} from "../../dtos";
import { ListPublicMenu, ListPublicUnits, SimulateFreight } from "../../useCases";

/** Customer-facing, unauthenticated storefront endpoints. Company is resolved from the
 * `slug` baked into each whitelabel build (docs/02). */
export const PublicUnitsController = new Elysia({
	detail: {
		tags: ["Public"],
	},
})
	.use([GlobalPlugin])
	.group("/public", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				listPublicMenu: new ListPublicMenu(prisma),
				listPublicUnits: new ListPublicUnits(prisma),
				prisma,
				simulateFreight: new SimulateFreight(prisma),
			}))
			.get("/units", async ({ listPublicUnits, query }) => listPublicUnits.execute(query.slug), {
				query: t.Object({ slug: t.Optional(t.String()) }),
				response: PublicUnitListReturn,
			})
			.get(
				"/units/:unitSlug/menu",
				async ({ listPublicMenu, params, query }) => listPublicMenu.execute(query.slug, params.unitSlug),
				{
					params: t.Object({ unitSlug: t.String() }),
					query: t.Object({ slug: t.Optional(t.String()) }),
					response: PublicMenuReturn,
				},
			)
			.post("/freight/simulate", async ({ body, simulateFreight }) => simulateFreight.execute(body), {
				body: FreightSimulateBody,
				response: FreightSimulateReturn,
			}),
	);
