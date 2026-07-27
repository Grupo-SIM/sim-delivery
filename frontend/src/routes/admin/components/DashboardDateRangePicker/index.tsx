import { useEffect, useMemo, useRef, useState } from "react";
import { LuCalendarDays, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { cn } from "@/lib/utils";

interface DateRange {
	endDate: string;
	startDate: string;
}

interface DashboardDateRangePickerProps {
	inline?: boolean;
	onChange: (range: DateRange) => void;
	placeholder?: string;
	presetOptions?: { label: string; value: string }[];
	onPresetChange?: (preset: string) => void;
	presetValue?: string;
	value: DateRange | null;
}

function formatDate(date: Date) {
	return [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, "0"),
		String(date.getDate()).padStart(2, "0"),
	].join("-");
}

function formatRange(range: DateRange) {
	const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
	return `${formatter.format(new Date(`${range.startDate}T12:00:00`))} – ${formatter.format(new Date(`${range.endDate}T12:00:00`))}`;
}

export function DashboardDateRangePicker({
	inline = false,
	onChange,
	onPresetChange,
	placeholder,
	presetOptions,
	presetValue,
	value,
}: DashboardDateRangePickerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(inline);
	const [calendarMonth, setCalendarMonth] = useState(() => new Date());
	const [startDate, setStartDate] = useState<string | null>(value?.startDate ?? null);
	const [endDate, setEndDate] = useState<string | null>(value?.endDate ?? null);
	const days = useMemo(() => {
		const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
		const totalDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
		return Array.from(
			{ length: Math.ceil((firstDay + totalDays) / 7) * 7 },
			(_, index) => index - firstDay + 1,
		);
	}, [calendarMonth]);

	useEffect(() => {
		setStartDate(value?.startDate ?? null);
		setEndDate(value?.endDate ?? null);
	}, [value]);

	useEffect(() => {
		if (!open || inline) return;

		function closeOnOutsideClick(event: MouseEvent) {
			if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
		}

		function closeOnEscape(event: KeyboardEvent) {
			if (event.key === "Escape") setOpen(false);
		}

		document.addEventListener("mousedown", closeOnOutsideClick);
		document.addEventListener("keydown", closeOnEscape);
		return () => {
			document.removeEventListener("mousedown", closeOnOutsideClick);
			document.removeEventListener("keydown", closeOnEscape);
		};
	}, [open, inline]);

	function selectDay(day: number) {
		const nextDate = formatDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
		if (!startDate || endDate) {
			setStartDate(nextDate);
			setEndDate(null);
			return;
		}

		const range =
			nextDate < startDate ? { endDate: startDate, startDate: nextDate } : { endDate: nextDate, startDate };
		setStartDate(range.startDate);
		setEndDate(range.endDate);
		onChange(range);
		if (!inline) setOpen(false);
	}

	const calendar = (
		<div
			className={cn(
				!inline &&
					"absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-popover p-3 shadow-medium",
				inline && "p-3",
			)}
			role="dialog"
		>
			<div className="mb-3 flex items-center justify-between">
				<button
					aria-label="Mês anterior"
					className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-input hover:bg-accent"
					onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
					type="button"
				>
					<LuChevronLeft className="h-4 w-4" />
				</button>
				<strong className="text-sm capitalize">
					{new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(calendarMonth)}
				</strong>
				<button
					aria-label="Próximo mês"
					className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-input hover:bg-accent"
					onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
					type="button"
				>
					<LuChevronRight className="h-4 w-4" />
				</button>
			</div>
			<div className="grid grid-cols-7 gap-1 text-center text-muted-foreground text-xs">
				{["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
					<span key={`${day}-${index}`}>{day}</span>
				))}
			</div>
			<div className="mt-1 grid grid-cols-7 gap-1">
				{days.map((day, index) => {
					const inMonth =
						day > 0 &&
						day <= new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
					const date = inMonth
						? formatDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day))
						: null;
					const selected = Boolean(date) && (date === startDate || date === endDate);
					const withinRange = Boolean(date && startDate && endDate && date > startDate && date < endDate);

					return (
						<button
							className={cn(
								"h-9 rounded text-sm",
								inMonth ? "cursor-pointer hover:bg-accent" : "cursor-default",
								withinRange && "bg-primary/10",
								selected && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
							)}
							disabled={!inMonth}
							key={index}
							onClick={() => inMonth && selectDay(day)}
							type="button"
						>
							{inMonth ? day : ""}
						</button>
					);
				})}
			</div>
			<p className="mt-3 text-muted-foreground text-xs">Selecione a data inicial e a final.</p>
			{presetOptions && onPresetChange && presetValue && (
				<div className="mt-3 border-border border-t pt-3">
					<CustomSelect onChange={onPresetChange} options={presetOptions} value={presetValue} />
				</div>
			)}
		</div>
	);

	if (inline) return calendar;

	return (
		<div className="relative" ref={containerRef}>
			<button
				aria-expanded={open}
				aria-haspopup="dialog"
				className="flex h-11 min-w-48 cursor-pointer items-center gap-2 rounded-xl border border-input bg-background px-3 font-semibold text-sm shadow-sm outline-none ring-offset-background transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				onClick={() => setOpen(value => !value)}
				type="button"
			>
				<LuCalendarDays className="h-4 w-4 text-muted-foreground" />
				<span>{value ? formatRange(value) : placeholder}</span>
			</button>
			{open && calendar}
		</div>
	);
}
