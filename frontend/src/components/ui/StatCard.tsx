import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
	label: ReactNode;
	value: ReactNode;
	hint?: ReactNode;
	tone?: "default" | "destructive" | "success";
	onClick?: () => void;
}

const toneValueClass = {
	default: "text-foreground",
	destructive: "text-destructive",
	success: "text-success",
} as const;

export function StatCard({ hint, label, onClick, tone = "default", value }: StatCardProps) {
	const interactive = typeof onClick === "function";

	const body = (
		<>
			<p className="text-muted-foreground text-xs uppercase">{label}</p>
			<p className={cn("mt-1 font-bold text-xl", toneValueClass[tone])}>{value}</p>
			{hint != null && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
		</>
	);

	const baseClass = "rounded-brand border border-border bg-card p-4 text-left shadow-soft transition-[box-shadow,border-color] duration-300";

	if (!interactive) {
		return <div className={baseClass}>{body}</div>;
	}

	return (
		<button
			className={cn(baseClass, "cursor-pointer hover:border-primary/40 hover:shadow-medium")}
			onClick={onClick}
			type="button"
		>
			{body}
		</button>
	);
}
