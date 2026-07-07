import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	title: ReactNode;
	description?: ReactNode;
	action?: ReactNode;
	className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3 rounded-brand border border-border border-dashed bg-muted/30 px-6 py-10 text-center",
				className,
			)}
		>
			<p className="font-semibold text-foreground text-sm">{title}</p>
			{description && <p className="max-w-md text-muted-foreground text-xs">{description}</p>}
			{action && <div>{action}</div>}
		</div>
	);
}
