import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuCalendarDays, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { MaskedInput } from "./MaskedInput";

interface DateTimePickerProps {
	className?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	value: string;
}

interface PopupPosition {
	left: number;
	top: number;
}

function parseDateTime(value: string): Date | null {
	if (value.length !== 12) return null;

	const year = Number(value.slice(0, 4));
	const month = Number(value.slice(4, 6));
	const day = Number(value.slice(6, 8));
	const hours = Number(value.slice(8, 10));
	const minutes = Number(value.slice(10, 12));
	const date = new Date(year, month - 1, day, hours, minutes);

	if (
		date.getFullYear() !== year ||
		date.getMonth() !== month - 1 ||
		date.getDate() !== day ||
		date.getHours() !== hours ||
		date.getMinutes() !== minutes
	) {
		return null;
	}

	return date;
}

function toDigits(date: Date) {
	return [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, "0"),
		String(date.getDate()).padStart(2, "0"),
		String(date.getHours()).padStart(2, "0"),
		String(date.getMinutes()).padStart(2, "0"),
	].join("");
}

function inputToDigits(value: string) {
	return value.slice(4, 8) + value.slice(2, 4) + value.slice(0, 2) + value.slice(8);
}

function digitsToInput(value: string) {
	return value.slice(6, 8) + value.slice(4, 6) + value.slice(0, 4) + value.slice(8);
}

function monthLabel(date: Date) {
	return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

export function DateTimePicker({
	className,
	onChange,
	placeholder = "dd/mm/aaaa hh:mm",
	value,
}: DateTimePickerProps) {
	const inputId = useId();
	const fieldRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const popupRef = useRef<HTMLDivElement>(null);
	const parsedValue = parseDateTime(value);
	const [open, setOpen] = useState(false);
	const [popupPosition, setPopupPosition] = useState<PopupPosition>({ left: 0, top: 0 });
	const [calendarMonth, setCalendarMonth] = useState(() => {
		const date = parsedValue ?? new Date();
		return new Date(date.getFullYear(), date.getMonth(), 1);
	});
	const [time, setTime] = useState(() =>
		parsedValue ? `${value.slice(8, 10)}:${value.slice(10, 12)}` : "23:59",
	);
	const isInvalid = value.length > 0 && !parsedValue;
	const days = useMemo(() => {
		const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
		const totalDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
		return Array.from(
			{ length: Math.ceil((firstDay + totalDays) / 7) * 7 },
			(_, index) => index - firstDay + 1,
		);
	}, [calendarMonth]);

	function openPicker() {
		const rect = fieldRef.current?.getBoundingClientRect();
		if (!rect) return;

		const selected = parsedValue ?? new Date();
		setCalendarMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
		setTime(parsedValue ? `${value.slice(8, 10)}:${value.slice(10, 12)}` : "23:59");
		setPopupPosition({ left: rect.left, top: rect.bottom + 4 });
		setOpen(true);
	}

	function selectDay(day: number) {
		const [hours = "23", minutes = "59"] = time.split(":");
		const date = new Date(
			calendarMonth.getFullYear(),
			calendarMonth.getMonth(),
			day,
			Number(hours),
			Number(minutes),
		);
		onChange(toDigits(date));
		setOpen(false);
	}

	function updateTime(next: string) {
		setTime(next);
		if (!parsedValue || !/^([01]\d|2[0-3]):[0-5]\d$/.test(next)) return;

		const [hours, minutes] = next.split(":");
		const date = new Date(parsedValue);
		date.setHours(Number(hours), Number(minutes), 0, 0);
		onChange(toDigits(date));
	}

	useEffect(() => {
		if (!open) return;

		function closeOnOutsideClick(event: MouseEvent) {
			if (
				!triggerRef.current?.contains(event.target as Node) &&
				!popupRef.current?.contains(event.target as Node)
			)
				setOpen(false);
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
	}, [open]);

	return (
		<div className={cn("relative", className)}>
			<div className="relative" ref={fieldRef}>
				<MaskedInput
					aria-describedby={isInvalid ? `${inputId}-error` : undefined}
					aria-invalid={isInvalid}
					format="##/##/#### ##:##"
					id={inputId}
					inputMode="numeric"
					mask="_"
					onValueChange={({ value: next }) => onChange(inputToDigits(next))}
					placeholder={placeholder}
					value={digitsToInput(value)}
				/>
				<button
					aria-label="Selecionar data e hora"
					className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-md border-input border-l text-muted-foreground hover:bg-muted hover:text-foreground"
					onClick={openPicker}
					ref={triggerRef}
					type="button"
				>
					<LuCalendarDays className="h-4 w-4" />
				</button>
			</div>
			{isInvalid && (
				<p className="mt-1 text-destructive text-xs" id={`${inputId}-error`}>
					Informe uma data e hora válidas.
				</p>
			)}

			{open &&
				createPortal(
					<div
						className="w-80 rounded-md border border-border bg-popover text-popover-foreground p-3 shadow-medium"
						ref={popupRef}
						style={{ left: popupPosition.left, position: "fixed", top: popupPosition.top, zIndex: 9999 }}
					>
						<div className="mb-3 flex items-center justify-between">
							<Button
								aria-label="Mês anterior"
								onClick={() =>
									setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))
								}
								size="icon"
								type="button"
								variant="outline"
							>
								<LuChevronLeft className="h-4 w-4" />
							</Button>
							<strong className="text-sm capitalize">{monthLabel(calendarMonth)}</strong>
							<Button
								aria-label="Próximo mês"
								onClick={() =>
									setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))
								}
								size="icon"
								type="button"
								variant="outline"
							>
								<LuChevronRight className="h-4 w-4" />
							</Button>
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
								const selected =
									inMonth &&
									parsedValue?.getFullYear() === calendarMonth.getFullYear() &&
									parsedValue.getMonth() === calendarMonth.getMonth() &&
									parsedValue.getDate() === day;
								return (
									<button
										className={cn(
											"h-9 rounded text-sm",
											inMonth ? "cursor-pointer hover:bg-muted" : "cursor-default",
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
						{/* biome-ignore lint/a11y/noLabelWithoutControl: MaskedInput is a custom control nested in the label. */}
						<label className="mt-3 grid gap-1 font-medium text-sm">
							Hora
							<MaskedInput
								format="##:##"
								inputMode="numeric"
								mask="_"
								onValueChange={({ value: next }) => updateTime(`${next.slice(0, 2)}:${next.slice(2)}`)}
								placeholder="23:59"
								value={time.replace(":", "")}
							/>
						</label>
					</div>,
					document.body,
				)}
		</div>
	);
}
