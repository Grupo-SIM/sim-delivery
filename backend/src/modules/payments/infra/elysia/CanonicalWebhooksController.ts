import Elysia, { t } from "elysia";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { simpay } from "@/shared/infra/simpay";
import { receiveCanonicalWebhook } from "../../useCases/canonical-webhooks";
export const CanonicalWebhooksController = new Elysia().use(GlobalPlugin)
	.post("/integrations/simintpay/:companyId/events", ({ body, params, request, prisma }) => receiveCanonicalWebhook(prisma, simpay, params.companyId, body, request.headers.get("x-simintpay-signature")), { parse: "text", body: t.String(), response: t.Object({ ok: t.Boolean() }) });
