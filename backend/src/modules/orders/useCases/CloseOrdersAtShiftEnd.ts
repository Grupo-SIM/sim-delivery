import { orderEvents } from "@/shared/infra/OrderEvents";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CloseOrdersDay } from "./CloseOrdersDay";

interface UnitHoursRow {
	closed: boolean;
	closesAt: string | null;
	opensAt: string | null;
	weekday: number;
}

interface Shift {
	end: Date;
	start: Date;
}

const INTERVAL_MS = 60_000;

function toMinutes(time: string): number {
	const [hours, minutes] = time.split(":").map(Number);
	return hours * 60 + minutes;
}

export function getLatestCompletedShift(hours: UnitHoursRow[], now: Date = new Date()): Shift | null {
	for (let daysAgo = 0; daysAgo < 8; daysAgo += 1) {
		const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
		const schedule = hours.find(hour => hour.weekday === day.getDay());
		if (!schedule || schedule.closed || !schedule.opensAt || !schedule.closesAt) continue;

		const open = toMinutes(schedule.opensAt);
		const close = toMinutes(schedule.closesAt);
		if (open === close) continue;

		const start = new Date(day);
		start.setHours(Math.floor(open / 60), open % 60, 0, 0);
		const end = new Date(day);
		end.setHours(Math.floor(close / 60), close % 60, 0, 0);
		if (close <= open) end.setDate(end.getDate() + 1);
		if (end <= now) return { end, start };
	}

	return null;
}

export class CloseOrdersAtShiftEnd {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(now = new Date()): Promise<number> {
		const units = await this.prisma.unit.findMany({
			select: { companyId: true, hours: true, id: true },
			where: { active: true },
		});
		const closer = new CloseOrdersDay(this.prisma);
		let cancelled = 0;

		for (const unit of units) {
			const shift = getLatestCompletedShift(unit.hours, now);
			if (!shift) continue;
			const count = await closer.closePendingOrders(unit.companyId, {
				createdAfter: shift.start,
				createdBefore: shift.end,
				unitId: unit.id,
			});
			if (count > 0) orderEvents.publish(unit.companyId, unit.id);
			cancelled += count;
		}

		return cancelled;
	}
}

export function startShiftEndOrderClosure(prisma: PrismaInstance): () => void {
	const closure = new CloseOrdersAtShiftEnd(prisma);
	const run = () => void closure.execute().catch(error => console.error("Failed to close orders at shift end", error));
	run();
	const timer = setInterval(run, INTERVAL_MS);
	timer.unref();
	return () => clearInterval(timer);
}
