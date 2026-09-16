import Elysia, { t } from "elysia";
import { createHmac, timingSafeEqual } from "node:crypto";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { DomainError } from "@/shared/errors";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { simpay } from "@/shared/infra/simpay";
import { RequestWithdrawalBody, WithdrawalListQuery, WithdrawalListReturn, WithdrawalQuoteBody, WithdrawalQuoteReturn, WithdrawalReturn, WithdrawalSummaryReturn, WithdrawalWebhookBody } from "../dtos";
import { WithdrawalErrors } from "../errors";
import { WithdrawalService } from "../service";

export const WithdrawalController = new Elysia({ prefix: "/finance" })
	.use(GlobalPlugin)
	.decorate(({ prisma }) => ({ withdrawals: new WithdrawalService(prisma, simpay) }))
	.get("/wallet", async ({ request, withdrawals }) => {
		const scope = await CompanyScopeGuard.execute(request.headers);
		CompanyScopeGuard.authorize(scope, "withdrawals", "read");
		if (!scope.companyId) throw new DomainError(WithdrawalErrors.WITHDRAWAL_MERCHANT_NOT_CONFIGURED);
		return withdrawals.summary(scope.companyId);
	}, { response: WithdrawalSummaryReturn })
	.post("/withdrawals/quote", async ({ body, request, withdrawals }) => {
		const scope = await CompanyScopeGuard.execute(request.headers);
		CompanyScopeGuard.authorize(scope, "withdrawals", "request");
		if (!scope.companyId) throw new DomainError(WithdrawalErrors.WITHDRAWAL_MERCHANT_NOT_CONFIGURED);
		return withdrawals.quote(scope.companyId, body.grossAmountCents);
	}, { body: WithdrawalQuoteBody, response: WithdrawalQuoteReturn })
	.post("/withdrawals", async ({ body, request, withdrawals }) => {
		const scope = await CompanyScopeGuard.execute(request.headers);
		CompanyScopeGuard.authorize(scope, "withdrawals", "request");
		if (!scope.companyId) throw new DomainError(WithdrawalErrors.WITHDRAWAL_MERCHANT_NOT_CONFIGURED);
		return withdrawals.request(scope.companyId, scope.userId, body.grossAmountCents, body.pixKey);
	}, { body: RequestWithdrawalBody, response: WithdrawalReturn })
	.get("/withdrawals", async ({ query, request, withdrawals }) => {
		const scope = await CompanyScopeGuard.execute(request.headers);
		CompanyScopeGuard.authorize(scope, "withdrawals", "read");
		if (!scope.companyId) throw new DomainError(WithdrawalErrors.WITHDRAWAL_MERCHANT_NOT_CONFIGURED);
		return withdrawals.list(scope.companyId, query.page ?? 1, query.pageSize ?? 10);
	}, { query: WithdrawalListQuery, response: WithdrawalListReturn })
	.get("/withdrawals/:withdrawalId", async ({ params, request, withdrawals }) => {
		const scope = await CompanyScopeGuard.execute(request.headers);
		CompanyScopeGuard.authorize(scope, "withdrawals", "read");
		if (!scope.companyId) throw new DomainError(WithdrawalErrors.WITHDRAWAL_MERCHANT_NOT_CONFIGURED);
		return withdrawals.get(scope.companyId, params.withdrawalId);
	}, { response: WithdrawalReturn })
	.post("/withdrawals/webhooks/simintpay", async ({ body, request, withdrawals }) => {
		const expected = process.env.SIMPAY_WEBHOOK_SECRET?.trim();
		const received = request.headers.get("x-simpay-signature") ?? "";
		const signature = expected ? createHmac("sha256", expected).update(JSON.stringify(body)).digest("hex") : "";
		const valid = received.length === signature.length && received.length > 0 && timingSafeEqual(Buffer.from(received), Buffer.from(signature));
		if (!valid) throw new DomainError(WithdrawalErrors.WITHDRAWAL_WEBHOOK_UNAUTHORIZED);
		return withdrawals.webhook(body);
	}, { body: WithdrawalWebhookBody, response: t.Object({ ok: t.Boolean() }) });
