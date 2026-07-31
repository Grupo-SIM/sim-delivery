import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ScrollArea";

interface DataTableProps extends ComponentPropsWithoutRef<"div"> {
	children: ReactNode;
	tableClassName?: string;
}

export function DataTable({ children, className, tableClassName, ...props }: DataTableProps) {
	return (
		<ScrollArea
			className={cn(
				"overflow-x-auto overscroll-x-contain rounded-md border border-border bg-card [-webkit-overflow-scrolling:touch]",
				className,
			)}
			{...props}
		>
			<table className={cn("w-full min-w-[720px] text-sm", tableClassName)}>{children}</table>
		</ScrollArea>
	);
}
