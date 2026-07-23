import { t } from "elysia";

const ReportPeriod = t.Union([
	t.Literal("today"),
	t.Literal("yesterday"),
	t.Literal("week"),
	t.Literal("month"),
	t.Literal("lastMonth"),
	t.Literal("quarter"),
	t.Literal("semester"),
	t.Literal("year"),
]);
const ReportGroupBy = t.Union([
	t.Literal("hourOfDay"),
	t.Literal("dayOfWeek"),
	t.Literal("dayOfMonth"),
	t.Literal("month"),
	t.Literal("quarter"),
	t.Literal("year"),
]);

export const GetReportsQuery = t.Object({
	endDate: t.Optional(t.String()),
	period: t.Optional(ReportPeriod),
	startDate: t.Optional(t.String()),
	unitId: t.Optional(t.String()),
});

export const GetDashboardAnalyticsQuery = t.Object({
	endDate: t.Optional(t.String()),
	groupBy: t.Optional(ReportGroupBy),
	period: t.Optional(ReportPeriod),
	startDate: t.Optional(t.String()),
	unitId: t.Optional(t.String()),
});

export type GetReportsQuery = typeof GetReportsQuery.static;
export type GetDashboardAnalyticsQuery = typeof GetDashboardAnalyticsQuery.static;
