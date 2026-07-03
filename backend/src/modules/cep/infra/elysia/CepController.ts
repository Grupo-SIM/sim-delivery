import Elysia, { t } from "elysia";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { CepReturn } from "../../dtos";
import { LookupCep } from "../../useCases";

/** Customer-facing, unauthenticated CEP → address proxy used by the checkout form. */
export const CepController = new Elysia({
	detail: {
		tags: ["Public"],
	},
})
	.use([GlobalPlugin])
	.decorate({ lookupCep: new LookupCep() })
	.get("/cep/:cep", async ({ lookupCep, params }) => lookupCep.execute(params.cep), {
		params: t.Object({ cep: t.String() }),
		response: CepReturn,
	});
