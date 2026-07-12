import Elysia from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { prisma } from "@/shared/infra/sql";
import { BestSellersReturn, GetReportsQuery, RevenueSummaryReturn } from "../../dtos";
import { GetBestSellers, GetRevenueSummary } from "../../useCases";

const getBestSellers = new GetBestSellers(prisma);
const getRevenueSummary = new GetRevenueSummary(prisma);

export const ReportsController = new Elysia({ prefix: "/reports" })
	.get(
		"/summary",
		async ({ query, request }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "reports", "read");
			return getRevenueSummary.execute(scope.companyId, query);
		},
		{ query: GetReportsQuery, response: RevenueSummaryReturn },
	)
	.get(
		"/best-sellers",
		async ({ query, request }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "reports", "read");
			return getBestSellers.execute(scope.companyId, query);
		},
		{ query: GetReportsQuery, response: BestSellersReturn },
	);
