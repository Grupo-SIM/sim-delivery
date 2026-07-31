export const dashboardPeriodValues = [
	"today",
	"yesterday",
	"week",
	"month",
	"lastMonth",
	"quarter",
	"semester",
	"year",
] as const;

export type DashboardPeriod = (typeof dashboardPeriodValues)[number];
export type DashboardPeriodSelection = DashboardPeriod | "custom";
