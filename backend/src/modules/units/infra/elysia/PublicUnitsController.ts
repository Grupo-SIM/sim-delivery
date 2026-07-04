import Elysia, { t } from "elysia";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { FreightSimulateBody, FreightSimulateReturn, PublicMenuReturn, PublicUnitListReturn } from "../../dtos";
import { ListPublicMenu, ListPublicUnits, SimulateFreight } from "../../useCases";

/** Customer-facing, unauthenticated storefront endpoints. Company is resolved from the
 * `variantKey` baked into each whitelabel build (docs/02). */
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
			.get("/units", async ({ listPublicUnits, query }) => listPublicUnits.execute(query.variantKey), {
				query: t.Object({ variantKey: t.Optional(t.String()) }),
				response: PublicUnitListReturn,
			})
			.get(
				"/units/:unitId/menu",
				async ({ listPublicMenu, params }) => listPublicMenu.execute(params.unitId),
				{
					params: t.Object({ unitId: t.String() }),
					response: PublicMenuReturn,
				},
			)
			.post(
				"/freight/simulate",
				async ({ body, simulateFreight }) => simulateFreight.execute(body),
				{ body: FreightSimulateBody, response: FreightSimulateReturn },
			),
	);
