import { Elysia } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { prisma } from "@/shared/infra/sql";
import {
	BestSellersReturn,
	DashboardAnalyticsReturn,
	FinancialAnalyticsReturn,
	GetDashboardAnalyticsQuery,
	GetReportsQuery,
	RevenueSummaryReturn,
} from "../../dtos";
import { ExportReports, GetBestSellers, GetDashboardAnalytics, GetFinancialAnalytics, GetRevenueSummary } from "../../useCases";

const getBestSellers = new GetBestSellers(prisma);
const getDashboardAnalytics = new GetDashboardAnalytics(prisma);
const getFinancialAnalytics = new GetFinancialAnalytics(prisma);
const getRevenueSummary = new GetRevenueSummary(prisma);
const exportReports = new ExportReports(prisma, getRevenueSummary, getBestSellers, getDashboardAnalytics, getFinancialAnalytics);

export const ReportsController = new Elysia({ prefix: "/reports" })
	.get("/summary", async ({ query, request }) => {
		const scope = await CompanyScopeGuard.execute(request.headers);
		CompanyScopeGuard.authorize(scope, "reports", "read");
		return getRevenueSummary.execute(scope.companyId, query);
	}, { query: GetReportsQuery, response: RevenueSummaryReturn })
	.get("/dashboard-analytics", async ({ query, request }) => {
		const scope = await CompanyScopeGuard.execute(request.headers);
		CompanyScopeGuard.authorize(scope, "reports", "read");
		return getDashboardAnalytics.execute(scope.companyId, query);
	}, { query: GetDashboardAnalyticsQuery, response: DashboardAnalyticsReturn })
	.get("/financial", async ({ query, request }) => {
		const scope = await CompanyScopeGuard.execute(request.headers);
		CompanyScopeGuard.authorize(scope, "reports", "read");
		return getFinancialAnalytics.execute(scope.companyId, query);
	}, { query: GetDashboardAnalyticsQuery, response: FinancialAnalyticsReturn })
	.get("/best-sellers", async ({ query, request }) => {
		const scope = await CompanyScopeGuard.execute(request.headers);
		CompanyScopeGuard.authorize(scope, "reports", "read");
		return getBestSellers.execute(scope.companyId, query);
	}, { query: GetReportsQuery, response: BestSellersReturn })
	.get("/export", async ({ query, request, set }) => {
		const scope = await CompanyScopeGuard.execute(request.headers);
		CompanyScopeGuard.authorize(scope, "reports", "read");
		const workbook = await exportReports.execute(scope.companyId, query);
		const today = new Date().toISOString().slice(0, 10);
		set.headers["content-type"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		set.headers["content-disposition"] = `attachment; filename="relatorio-${today}.xlsx"`;
		return workbook;
	}, { query: GetReportsQuery });
