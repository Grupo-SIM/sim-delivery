import type { ReactNode } from "react";

interface NavGroupProps {
	children: ReactNode;
	label: string;
}
export function AdminNavGroup({ children, label }: NavGroupProps) {
	return (
		<div className="space-y-1">
			<p className="mb-1 px-3 font-bold text-[11px] text-muted-foreground uppercase tracking-wider">
				{label}
			</p>
			{children}
		</div>
	);
}
