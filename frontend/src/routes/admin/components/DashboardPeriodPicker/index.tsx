import { type ReactNode, useEffect, useRef, useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { cn } from "@/lib/utils";
import { type DashboardPeriod, type DashboardPeriodSelection, dashboardPeriodValues } from "./types";

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
				className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-input bg-background px-3 font-semibold text-sm shadow-sm outline-none ring-offset-background transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				onClick={() => setOpen(value => !value)}
				type="button"
			>
				{labels[period]}
				<LuChevronDown
					className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
				/>
			</button>
			{open && (
				<ScrollArea
					className="absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground py-1 shadow-medium"
					role="listbox"
				>
					{dashboardPeriodValues.map(option => (
						<button
							aria-selected={option === period}
							className={cn(
								"flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
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
				</ScrollArea>
			)}
		</div>
	);
}
