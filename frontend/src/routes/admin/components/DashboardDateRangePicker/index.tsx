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
		const firstOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
		const firstVisibleDate = new Date(firstOfMonth);
		firstVisibleDate.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
		const lastOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
		const visibleWeekCount = Math.ceil((firstOfMonth.getDay() + lastOfMonth.getDate()) / 7);

		return Array.from({ length: visibleWeekCount * 7 }, (_, index) => {
			const date = new Date(firstVisibleDate);
			date.setDate(firstVisibleDate.getDate() + index);
			return date;
		});
	}, [calendarMonth]);

	const presetRange = useMemo(() => {
		if (value || !presetValue || presetValue === "custom") return null;

		const today = new Date();
		const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const end = new Date(start);

		switch (presetValue) {
			case "today":
				break;
			case "yesterday":
				start.setDate(start.getDate() - 1);
				end.setDate(end.getDate() - 1);
				break;
			case "week":
				start.setDate(start.getDate() - 6);
				break;
			case "month":
				start.setDate(1);
				end.setFullYear(today.getFullYear(), today.getMonth() + 1, 0);
				break;
			case "lastMonth":
				start.setFullYear(today.getFullYear(), today.getMonth() - 1, 1);
				end.setFullYear(today.getFullYear(), today.getMonth(), 0);
				break;
			case "quarter":
				start.setFullYear(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
				end.setFullYear(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0);
				break;
			case "semester":
				start.setFullYear(today.getFullYear(), today.getMonth() < 6 ? 0 : 6, 1);
				end.setFullYear(today.getFullYear(), today.getMonth() < 6 ? 6 : 12, 0);
				break;
			case "year":
				start.setFullYear(today.getFullYear(), 0, 1);
				end.setFullYear(today.getFullYear(), 11, 31);
				break;
			default:
				return null;
		}

		return { endDate: formatDate(end), startDate: formatDate(start) };
	}, [presetValue, value]);

	const selectedRange = value ?? (startDate && !endDate ? { endDate: startDate, startDate } : presetRange);
	const selectedStartDate = selectedRange?.startDate;
	const selectedEndDate = selectedRange?.endDate;

	useEffect(() => {
		setStartDate(value?.startDate ?? null);
		setEndDate(value?.endDate ?? null);

		const initialDate = value?.startDate ?? presetRange?.startDate;
		if (!initialDate) return;

		const date = new Date(`${initialDate}T12:00:00`);
		setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
	}, [presetRange?.startDate, value]);

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

	function selectDay(date: Date) {
		const nextDate = formatDate(date);
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

	// A preset is what's actually driving the query while `value` is null, so the trigger shows its label.
	const label = value
		? formatRange(value)
		: (presetOptions?.find(option => option.value === presetValue && option.value !== "custom")?.label ??
			placeholder);

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
				{days.map(date => {
					const dateValue = formatDate(date);
					const inMonth = date.getMonth() === calendarMonth.getMonth();
					const selected = Boolean(selectedRange) && (dateValue === selectedStartDate || dateValue === selectedEndDate);
					const withinRange = Boolean(
						selectedRange &&
						dateValue > selectedRange.startDate &&
						dateValue < selectedRange.endDate,
					);

					return (
						<button
							className={cn(
								"h-9 cursor-pointer rounded text-sm hover:bg-accent",
								!inMonth && "text-muted-foreground",
								withinRange && "bg-primary/10",
								selected && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
							)}
							key={dateValue}
							onClick={() => selectDay(date)}
							type="button"
						>
							{date.getDate()}
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
				<span>{label}</span>
			</button>
			{open && calendar}
		</div>
	);
}
