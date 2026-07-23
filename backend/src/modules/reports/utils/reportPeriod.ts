import type { GetReportsQuery } from "../dtos";

export type ReportGroupBy = "dayOfMonth" | "dayOfWeek" | "hourOfDay" | "month" | "quarter" | "year";
export type ReportPeriod = NonNullable<GetReportsQuery["period"]>;

export function getReportPeriodStart(period?: ReportPeriod, now = new Date()): Date | undefined {
	if (period === "today") {
		return startOfDay(now);
	}
	if (period === "yesterday") {
		const start = startOfDay(now);
		start.setDate(start.getDate() - 1);
		return start;
	}
	if (period === "week") {
		const start = startOfDay(now);
		start.setDate(start.getDate() - 6);
		return start;
	}
	if (period === "month") {
		return new Date(now.getFullYear(), now.getMonth(), 1);
	}
	if (period === "lastMonth") {
		return new Date(now.getFullYear(), now.getMonth() - 1, 1);
	}
	if (period === "quarter") {
		return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
	}
	if (period === "semester") {
		return new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
	}
	if (period === "year") {
		return new Date(now.getFullYear(), 0, 1);
	}
	return undefined;
}

export function getReportPeriodEnd(period?: ReportPeriod, now = new Date()): Date | undefined {
	if (period === "yesterday") return startOfDay(now);
	if (period === "lastMonth") return new Date(now.getFullYear(), now.getMonth(), 1);
	if (period === "today" || period === "week") {
		const end = startOfDay(now);
		end.setDate(end.getDate() + 1);
		return end;
	}
	if (period === "month") return new Date(now.getFullYear(), now.getMonth() + 1, 1);
	if (period === "quarter") return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 1);
	if (period === "semester") return new Date(now.getFullYear(), now.getMonth() < 6 ? 6 : 12, 1);
	if (period === "year") return new Date(now.getFullYear() + 1, 0, 1);
	return undefined;
}

export function getReportDateRange(
	period: ReportPeriod | undefined,
	startDate: string | undefined,
	endDate: string | undefined,
	now = new Date(),
): { since: Date | undefined; until: Date | undefined } {
	if (startDate && endDate) {
		const since = new Date(`${startDate}T00:00:00`);
		const until = new Date(`${endDate}T00:00:00`);
		until.setDate(until.getDate() + 1);
		return { since, until };
	}

	return {
		since: getReportPeriodStart(period, now),
		until: getReportPeriodEnd(period, now),
	};
}

export function getDefaultReportGroupBy(since: Date | undefined, now = new Date()): ReportGroupBy {
	if (!since) return "year";

	const elapsedDays = Math.floor((startOfDay(now).getTime() - startOfDay(since).getTime()) / 86_400_000);
	if (elapsedDays < 2) return "hourOfDay";
	if (elapsedDays < 14) return "dayOfWeek";

	const elapsedMonths = (now.getFullYear() - since.getFullYear()) * 12 + now.getMonth() - since.getMonth();
	if (elapsedMonths < 2) return "dayOfMonth";
	if (elapsedMonths < 6) return "month";
	if (elapsedMonths < 24) return "quarter";
	return "year";
}

function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
