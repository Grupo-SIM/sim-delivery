import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
	title: ReactNode;
	description?: ReactNode;
	action?: ReactNode;
	className?: string;
}

export function ErrorState({ title, description, action, className }: ErrorStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-6 py-10 text-center",
				className,
			)}
			role="alert"
		>
			<p className="font-semibold text-destructive text-sm">{title}</p>
			{description && <p className="max-w-md text-muted-foreground text-xs">{description}</p>}
			{action && <div>{action}</div>}
		</div>
	);
}
