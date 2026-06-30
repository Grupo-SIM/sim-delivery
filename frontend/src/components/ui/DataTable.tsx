import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataTableProps extends ComponentPropsWithoutRef<"div"> {
	children: ReactNode;
}

export function DataTable({ children, className, ...props }: DataTableProps) {
	return (
		<div className={cn("overflow-x-auto rounded-lg border border-border bg-card", className)} {...props}>
			<table className="w-full min-w-[720px] text-sm">{children}</table>
		</div>
	);
}
