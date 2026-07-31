import type { ReportGroupBy } from "./reportPeriod";

export interface OrdersByPeriodItem {
	key: string;
	label: string;
	orderCount: number;
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function getOrdersByPeriod(
	orders: { createdAt: Date }[],
	groupBy: ReportGroupBy,
	since: Date | undefined,
	now = new Date(),
	until?: Date,
): OrdersByPeriodItem[] {
	const buckets = createBuckets(groupBy, since, now, until);
	const bucketsByKey = new Map(buckets.map(bucket => [bucket.key, bucket]));

	for (const order of orders) {
		const bucket = bucketsByKey.get(getBucketKey(order.createdAt, groupBy));
		if (bucket) bucket.orderCount += 1;
	}

	return buckets;
}

function createBuckets(
	groupBy: ReportGroupBy,
	since: Date | undefined,
	now: Date,
	until: Date | undefined,
): OrdersByPeriodItem[] {
	if (groupBy === "hourOfDay") return range(24).map(hour => bucket(String(hour), String(hour)));
	if (groupBy === "dayOfWeek") return WEEKDAYS.map((label, index) => bucket(String(index), label));
	if (groupBy === "dayOfMonth") return range(31).map(index => bucket(String(index + 1), String(index + 1)));
	if (groupBy === "month") {
		if (!since || !until) return MONTHS.map((label, index) => bucket(String(index), label));

		const monthCount =
			(until.getFullYear() - since.getFullYear()) * 12 + until.getMonth() - since.getMonth();
		if (monthCount <= 0 || monthCount > 12) {
			return MONTHS.map((label, index) => bucket(String(index), label));
		}

		return range(monthCount).map(index => {
			const month = new Date(since.getFullYear(), since.getMonth() + index, 1).getMonth();
			return bucket(String(month), MONTHS[month]);
		});
	}
	if (groupBy === "quarter") return range(4).map(index => bucket(String(index), `T${index + 1}`));

	const firstYear = since?.getFullYear() ?? now.getFullYear();
	return range(now.getFullYear() - firstYear + 1).map(index => {
		const year = firstYear + index;
		return bucket(String(year), String(year));
	});
}

function getBucketKey(date: Date, groupBy: ReportGroupBy): string {
	if (groupBy === "hourOfDay") return String(date.getHours());
	if (groupBy === "dayOfWeek") return String((date.getDay() + 6) % 7);
	if (groupBy === "dayOfMonth") return String(date.getDate());
	if (groupBy === "month") return String(date.getMonth());
	if (groupBy === "quarter") return String(Math.floor(date.getMonth() / 3));
	return String(date.getFullYear());
}

function bucket(key: string, label: string): OrdersByPeriodItem {
	return { key, label, orderCount: 0 };
}

function range(length: number): number[] {
	return Array.from({ length }, (_, index) => index);
}
