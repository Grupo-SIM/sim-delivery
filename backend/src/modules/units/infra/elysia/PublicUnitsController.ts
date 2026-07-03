import Elysia, { t } from "elysia";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { PublicUnitListReturn } from "../../dtos";
import { ListPublicUnits } from "../../useCases";

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
				listPublicUnits: new ListPublicUnits(prisma),
				prisma,
			}))
			.get("/units", async ({ listPublicUnits, query }) => listPublicUnits.execute(query.variantKey), {
				query: t.Object({ variantKey: t.Optional(t.String()) }),
				response: PublicUnitListReturn,
			}),
	);
