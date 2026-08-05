import { type ComponentPropsWithoutRef, type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Scrollbar } from "./Scrollbar";

interface DataTableProps extends ComponentPropsWithoutRef<"div"> {
	children: ReactNode;
	tableClassName?: string;
}

export function DataTable({ children, className, tableClassName, ...props }: DataTableProps) {
	const [viewport, setViewport] = useState<HTMLDivElement | null>(null);

	return (
		<div className="relative">
			<div
				className={cn(
					"scrollbar-none max-h-[65vh] overflow-auto overscroll-contain rounded-md border border-border bg-card [-webkit-overflow-scrolling:touch] [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-card",
					className,
				)}
				ref={setViewport}
				{...props}
			>
				<table className={cn("w-full min-w-[720px] text-sm", tableClassName)}>{children}</table>
			</div>
			<Scrollbar className="top-2 right-2 bottom-2 z-20" container={viewport} />
			<Scrollbar
				className="right-2 bottom-2 left-2 z-20"
				container={viewport}
				orientation="horizontal"
			/>
		</div>
	);
}
