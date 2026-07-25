import { type ReactNode, useEffect, useRef, useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import { cn } from "@/lib/utils";

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

interface DashboardPeriodPickerProps {
	datePicker?: ReactNode;
	labels: Record<DashboardPeriodSelection, string>;
	onChange: (period: DashboardPeriod) => void;
	period: DashboardPeriodSelection;
}

export function DashboardPeriodPicker({ datePicker, labels, onChange, period }: DashboardPeriodPickerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!open) return;

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
	}, [open]);

	function selectPeriod(nextPeriod: DashboardPeriod) {
		onChange(nextPeriod);
		setOpen(false);
	}

	return (
		<div className="relative w-48" ref={containerRef}>
			<button
				aria-expanded={open}
				aria-haspopup="listbox"
				className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-input bg-background px-3 font-semibold text-sm shadow-sm outline-none ring-offset-background transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				onClick={() => setOpen(value => !value)}
				type="button"
			>
				{labels[period]}
				<LuChevronDown
					className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
				/>
			</button>
			{open && (
				<div
					className="scrollbar-themed absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-popover py-1 shadow-medium"
					role="listbox"
				>
					{dashboardPeriodValues.map(option => (
						<button
							aria-selected={option === period}
							className={cn(
								"flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
								option === period && "bg-primary/10 font-semibold text-primary",
							)}
							key={option}
							onClick={() => selectPeriod(option)}
							role="option"
							type="button"
						>
							{labels[option]}
						</button>
					))}
					{datePicker && <div className="border-border border-t">{datePicker}</div>}
				</div>
			)}
		</div>
	);
}
