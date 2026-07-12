import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataTableProps extends ComponentPropsWithoutRef<"div"> {
	children: ReactNode;
	tableClassName?: string;
}

export function DataTable({ children, className, tableClassName, ...props }: DataTableProps) {
	return (
		<div className={cn("overflow-x-auto rounded-md border border-border bg-card", className)} {...props}>
			<table className={cn("w-full min-w-[720px] text-sm", tableClassName)}>{children}</table>
		</div>
	);
}
